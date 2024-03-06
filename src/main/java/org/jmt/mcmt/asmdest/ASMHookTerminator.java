package org.jmt.mcmt.asmdest;

import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinWorkerThread;
import java.util.concurrent.Phaser;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.jmt.mcmt.MCMT;
import org.jmt.mcmt.config.GeneralConfig;
import org.jmt.mcmt.serdes.SerDesHookTypes;
import org.jmt.mcmt.serdes.SerDesRegistry;
import org.jmt.mcmt.serdes.filter.ISerDesFilter;
import org.jmt.mcmt.serdes.pools.PostExecutePool;

import net.minecraft.network.protocol.game.ClientboundBlockEventPacket;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.item.FallingBlockEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.BlockEventData;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.entity.TickingBlockEntity;
import net.minecraft.world.level.block.piston.PistonMovingBlockEntity;
import net.minecraft.world.level.chunk.LevelChunk;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.ListenerList;
import net.minecraftforge.eventbus.api.EventListenerHelper;
import net.minecraftforge.eventbus.api.EventPriority;
import net.minecraftforge.eventbus.api.IEventListener;
import net.minecraftforge.fml.LogicalSide;

@SuppressWarnings("deprecation")
public class ASMHookTerminator {

    private static final Logger LOGGER = LogManager.getLogger();

    static Phaser worldPhaser;

    static ConcurrentHashMap<ServerLevel, Phaser> sharedPhasers = new ConcurrentHashMap<>();
    static ExecutorService worldPool;
    static ExecutorService tickPool;
    static MinecraftServer mcs;
    static AtomicBoolean isTicking = new AtomicBoolean();

    public static void setupThreadPool(int parallelism) {
        AtomicInteger worldPoolThreadID = new AtomicInteger();
        AtomicInteger tickPoolThreadID = new AtomicInteger();
        final ClassLoader cl = MCMT.class.getClassLoader();
        ForkJoinPool.ForkJoinWorkerThreadFactory worldThreadFactory = p -> {
            ForkJoinWorkerThread fjwt = ForkJoinPool.defaultForkJoinWorkerThreadFactory.newThread(p);
            fjwt.setName("MCMT-World-Pool-Thread-" + worldPoolThreadID.getAndIncrement());
            regThread("MCMT-World", fjwt);
            fjwt.setContextClassLoader(cl);
            return fjwt;
        };
        ForkJoinPool.ForkJoinWorkerThreadFactory tickThreadFactory = p -> {
            ForkJoinWorkerThread fjwt = ForkJoinPool.defaultForkJoinWorkerThreadFactory.newThread(p);
            fjwt.setName("MCMT-Tick-Pool-Thread-" + tickPoolThreadID.getAndIncrement());
            regThread("MCMT-Tick", fjwt);
            fjwt.setContextClassLoader(cl);
            return fjwt;
        };
        worldPool = new ForkJoinPool(Math.min(3, Math.max(parallelism / 2, 1)), worldThreadFactory, null, true);
        tickPool = new ForkJoinPool(parallelism, tickThreadFactory, null, true);
    }

    /**
     * Creates and sets up the thread pool
     */
    static {
        // Must be static here due to class loading shenanagins
        // setupThreadPool(4);
    }

    static Map<String, Set<Thread>> mcThreadTracker = new ConcurrentHashMap<String, Set<Thread>>();

    // Statistics
    public static AtomicInteger currentWorlds = new AtomicInteger();
    public static AtomicInteger currentEnts = new AtomicInteger();
    public static AtomicInteger currentTEs = new AtomicInteger();
    public static AtomicInteger currentEnvs = new AtomicInteger();

    //Operation logging
    public static Set<String> currentTasks = ConcurrentHashMap.newKeySet();

    public static void regThread(String poolName, Thread thread) {
        mcThreadTracker.computeIfAbsent(poolName, s -> ConcurrentHashMap.newKeySet()).add(thread);
    }

    public static boolean isThreadPooled(String poolName, Thread t) {
        return mcThreadTracker.containsKey(poolName) && mcThreadTracker.get(poolName).contains(t);
    }

    public static boolean serverExecutionThreadPatch(MinecraftServer ms) {
        return isThreadPooled("MCMT-World", Thread.currentThread()) || isThreadPooled("MCMT-Tick", Thread.currentThread());
    }

    static long tickStart = 0;

    public static void preTick(int size, MinecraftServer server) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableWorld) {
            if (worldPhaser != null) {
                //LOGGER.warn("Multiple servers?");
                return;
            } else {
                tickStart = System.nanoTime();
                isTicking.set(true);
                worldPhaser = new Phaser(size + 1);
                mcs = server;
            }
        }
    }

    public static void callTick(ServerLevel serverworld, BooleanSupplier hasTimeLeft, MinecraftServer server) {
        serverworld.random = RandomSource.createThreadSafe();
        if (GeneralConfig.disabled || GeneralConfig.disableWorld) {
            try {
                serverworld.tick(hasTimeLeft);
            } catch (Exception e) {
                throw e;
            }
            return;
        }
        if (mcs != server) {
            //LOGGER.warn("Multiple servers?");
            GeneralConfig.disabled = true;
            serverworld.tick(hasTimeLeft);
            return;
        } else {
            String taskName = null;
            if (GeneralConfig.opsTracing) {
                taskName = "WorldTick: " + serverworld.toString() + "@" + serverworld.hashCode();
                currentTasks.add(taskName);
            }
            String finalTaskName = taskName;
            worldPool.execute(() -> {
                try {
                    currentWorlds.incrementAndGet();
                    serverworld.tick(hasTimeLeft);
					if (GeneralConfig.disableWorldPostTick) {
						synchronized (net.minecraftforge.event.ForgeEventFactory.class) {
							net.minecraftforge.event.ForgeEventFactory.onPostLevelTick(serverworld,  hasTimeLeft);
						}
					} else {
						TickEvent.LevelTickEvent event = new TickEvent.LevelTickEvent(LogicalSide.SERVER, TickEvent.Phase.END, serverworld, hasTimeLeft);
						ListenerList ll = EventListenerHelper.getListenerList(TickEvent.LevelTickEvent.class);
						//TODO find better way to locate listeners
						IEventListener[] listeners = ll.getListeners(0);
						//TODO Add some way to cache listeners because this is
						//Janky and slow
						Map<EventPriority, List<IEventListener>> prioritymap = new HashMap<EventPriority, List<IEventListener>>();
						EventPriority current = EventPriority.HIGHEST;
						prioritymap.computeIfAbsent(current, i->new ArrayList<>());
						for (IEventListener iel : listeners) {
							if (iel instanceof EventPriority) {
								EventPriority newcurrent = (EventPriority) iel;
								// Shouldn't be absent but if exists then drop
								prioritymap.computeIfAbsent(newcurrent, i->new ArrayList<>());
								//List<IEventListener> iell = prioritymap.computeIfAbsent(newcurrent, i->new ArrayList<>());
								//iell.add(current); May break stuff so avoided;
								current = newcurrent;
							} else {
								prioritymap.get(current).add(iel);
							}
						}
						for (EventPriority ep : EventPriority.values()) {
							List<IEventListener> iell = prioritymap.get(ep);
							if (iell != null) {
								ep.invoke(event);
								for (IEventListener iel : iell) {
									worldPhaser.register();
									worldPool.execute(() -> {
										try {
											synchronized (iel) {
												iel.invoke(event);
											}
										} finally {
											worldPhaser.arriveAndDeregister();
										}
									});
								}
							}
						}
					}
                } finally {
                    worldPhaser.arriveAndDeregister();
                    currentWorlds.decrementAndGet();
                    if (GeneralConfig.opsTracing) currentTasks.remove(finalTaskName);
                }
            });
        }
    }

    public static long[] lastTickTime = new long[32];
    public static int lastTickTimePos = 0;
    public static int lastTickTimeFill = 0;

    public static void postTick(MinecraftServer server) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableWorld) {
            if (mcs != server) {
                //LOGGER.warn("Multiple servers?");
                return;
            } else {
                worldPhaser.arriveAndAwaitAdvance();
                isTicking.set(false);
                worldPhaser = null;
                //PostExecute logic
                Deque<Runnable> queue = PostExecutePool.POOL.getQueue();
                Iterator<Runnable> qi = queue.iterator();
                while (qi.hasNext()) {
                    Runnable r = qi.next();
                    r.run();
                    qi.remove();
                }
                lastTickTime[lastTickTimePos] = System.nanoTime() - tickStart;
                lastTickTimePos = (lastTickTimePos + 1) % lastTickTime.length;
                lastTickTimeFill = Math.min(lastTickTimeFill + 1, lastTickTime.length - 1);
            }
        }
    }

    public static void preChunkTick(ServerLevel world) {
        Phaser phaser; // Keep a party throughout 3 ticking phases
        if (!GeneralConfig.disabled && !GeneralConfig.disableEnvironment) {
            phaser = new Phaser(2);
        } else {
            phaser = new Phaser(1);
        }
        sharedPhasers.put(world, phaser);
    }

    public static void callTickChunks(ServerLevel world, LevelChunk chunk, int k) {
    	world.random = RandomSource.createThreadSafe();
        if (GeneralConfig.disabled || GeneralConfig.disableEnvironment) {
            world.tickChunk(chunk, k);
            return;
        }
        String taskName = null;
        if (GeneralConfig.opsTracing) {
            taskName = "EnvTick: " + chunk.toString() + "@" + chunk.hashCode();
            currentTasks.add(taskName);
        }
        String finalTaskName = taskName;
        sharedPhasers.get(world).register();
        tickPool.execute(() -> {
            try {
                currentEnvs.incrementAndGet();
                world.tickChunk(chunk, k);
            } finally {
                if (GeneralConfig.opsTracing) currentTasks.remove(finalTaskName);
                sharedPhasers.get(world).arriveAndDeregister();
                currentEnvs.decrementAndGet();
            }
        });
    }

    public static void postChunkTick(ServerLevel world) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableEnvironment) {
            var phaser = sharedPhasers.get(world);
            phaser.arriveAndDeregister();
            phaser.arriveAndAwaitAdvance();
        }
    }

    public static void preEntityTick(ServerLevel world) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableEntity) sharedPhasers.get(world).register();
    }

    public static void callEntityTick(Consumer<Entity> tickConsumer, Entity entityIn, ServerLevel serverworld) {
        serverworld.random = RandomSource.createThreadSafe();
        entityIn.random = RandomSource.createThreadSafe();
        if (GeneralConfig.disabled || GeneralConfig.disableEntity) {
        	tickConsumer.accept(entityIn);
            return;
        }
        if (entityIn instanceof Player || entityIn instanceof FallingBlockEntity ) {
        	tickConsumer.accept(entityIn);
            return;
        }
        String taskName = null;
        if (GeneralConfig.opsTracing) {
            taskName = "EntityTick: " + /*entityIn.toString() + KG: Wayyy too slow. Maybe for debug but needs to be done via flag in that circumstance */ "@" + entityIn.hashCode();
            currentTasks.add(taskName);
        }
        String finalTaskName = taskName;
        sharedPhasers.get(serverworld).register();
        tickPool.execute(() -> {
            try {
                final ISerDesFilter filter = SerDesRegistry.getFilter(SerDesHookTypes.EntityTick, entityIn.getClass());
                currentEnts.incrementAndGet();
                if (filter != null) {
                    filter.serialise(() -> tickConsumer.accept(entityIn), entityIn, entityIn.blockPosition(), serverworld, SerDesHookTypes.EntityTick);
                } else {
                	tickConsumer.accept(entityIn);
                }
            } finally {
                if (GeneralConfig.opsTracing) currentTasks.remove(finalTaskName);
                sharedPhasers.get(serverworld).arriveAndDeregister();
                currentEnts.decrementAndGet();
            }
        });
    }

    public static void postEntityTick(ServerLevel world) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableEntity) {
            var phaser = sharedPhasers.get(world);
            phaser.arriveAndDeregister();
            phaser.arriveAndAwaitAdvance();
        }
    }

    public static void preBlockEntityTick(ServerLevel world) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableTileEntity) sharedPhasers.get(world).register();
    }

    public static void callBlockEntityTick(TickingBlockEntity tte, Level world) {
    	world.random = RandomSource.createThreadSafe();
        if ((world instanceof ServerLevel) && tte instanceof LevelChunk.RebindableTickingBlockEntityWrapper && (((LevelChunk.RebindableTickingBlockEntityWrapper) tte).ticker instanceof LevelChunk.BoundTickingBlockEntity<?>)) {
            if (GeneralConfig.disabled || GeneralConfig.disableTileEntity) {
                tte.tick();
                return;
            }
            if (((LevelChunk.BoundTickingBlockEntity<?>) ((LevelChunk.RebindableTickingBlockEntityWrapper) tte).ticker).blockEntity instanceof PistonMovingBlockEntity) {
                tte.tick();
                return;
            }
            String taskName = null;
            if (GeneralConfig.opsTracing) {
                taskName = "TETick: " + tte.toString() + "@" + tte.hashCode();
                currentTasks.add(taskName);
            }
            String finalTaskName = taskName;
            sharedPhasers.get(world).register();
            tickPool.execute(() -> {
                try {
                    final ISerDesFilter filter = SerDesRegistry.getFilter(SerDesHookTypes.TETick, ((LevelChunk.RebindableTickingBlockEntityWrapper) tte).ticker.getClass());
                    currentTEs.incrementAndGet();
                    if (filter != null) filter.serialise(tte::tick, tte, tte.getPos(), world, SerDesHookTypes.TETick);
                    else tte.tick();
                } catch (Exception e) {
                    System.err.println("Exception ticking TE at " + tte.getPos());
                    e.printStackTrace();
                } finally {
                    if (GeneralConfig.opsTracing) currentTasks.remove(finalTaskName);
                    sharedPhasers.get(world).arriveAndDeregister();
                    currentTEs.decrementAndGet();
                }
            });
        } else tte.tick();
    }
    
	public static void sendQueuedBlockEvents(Deque<BlockEventData> d, ServerLevel sw) {
		Iterator<BlockEventData> bed = d.iterator();
		while (bed.hasNext()) {
			BlockEventData blockeventdata = bed.next();
			if (sw.doBlockEvent(blockeventdata)) {
				sw.getServer().getPlayerList().broadcast((Player)null, (double)blockeventdata.pos().getX(), (double)blockeventdata.pos().getY(), (double)blockeventdata.pos().getZ(), 64.0D, sw.dimension(), new ClientboundBlockEventPacket(blockeventdata.pos(), blockeventdata.block(), blockeventdata.paramA(), blockeventdata.paramB()));
			}
			if (!isTicking.get()) {
				LOGGER.fatal("Block updates outside of tick");
			}
			bed.remove();
		}
	}

    public static boolean filterTE(BlockEntity tte) {
        boolean isLocking = false;
        if (GeneralConfig.teBlackList.contains(tte.getClass())) {
            isLocking = true;
        }
        // Apparently a string starts with check is faster than Class.getPackage; who knew (I didn't)
        if (!isLocking && GeneralConfig.chunkLockModded && !tte.getClass().getName().startsWith("net.minecraft.world.level.block.entity.")) {
            isLocking = true;
        }
        if (isLocking && GeneralConfig.teWhiteList.contains(tte.getClass())) {
            isLocking = false;
        }
        if (tte instanceof PistonMovingBlockEntity) {
            isLocking = true;
        }
        return isLocking;
    }

    public static void postBlockEntityTick(ServerLevel world) {
        if (!GeneralConfig.disabled && !GeneralConfig.disableTileEntity) {
            var phaser = sharedPhasers.get(world);
            phaser.arriveAndDeregister();
            phaser.arriveAndAwaitAdvance();
        }
    }

    public static boolean shouldThreadChunks() {
        return !GeneralConfig.disableMultiChunk;
    }
}
