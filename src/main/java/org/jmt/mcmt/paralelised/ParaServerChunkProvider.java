package org.jmt.mcmt.paralelised;

import java.lang.ref.WeakReference;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import javax.annotation.Nullable;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.Marker;
import org.apache.logging.log4j.MarkerManager;
import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.jmt.mcmt.config.GeneralConfig;

import com.mojang.datafixers.DataFixer;

import net.minecraft.server.level.ServerChunkCache;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.progress.ChunkProgressListener;
import net.minecraft.world.level.ChunkPos;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.chunk.ChunkAccess;
import net.minecraft.world.level.chunk.ChunkGenerator;
import net.minecraft.world.level.chunk.ChunkStatus;
import net.minecraft.world.level.entity.ChunkStatusUpdateListener;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplateManager;
import net.minecraft.world.level.storage.DimensionDataStorage;
import net.minecraft.world.level.storage.LevelStorageSource;


/* 1.16.1 code; AKA the only thing that changed  */
//import net.minecraft.world.storage.SaveFormat.LevelSave;
/* */

/* 1.15.2 code; AKA the only thing that changed
import java.io.File;
/* */

public class ParaServerChunkProvider extends ServerChunkCache {

    protected ConcurrentHashMap<ChunkCacheAddress, ChunkCacheLine> chunkCache = new ConcurrentHashMap<ChunkCacheAddress, ChunkCacheLine>();
    protected AtomicInteger access = new AtomicInteger(Integer.MIN_VALUE);

    private static final int CACHE_DURATION_INTERVAL = 50; // ms, multiplies CACHE_DURATION
    protected static final int CACHE_DURATION = 200; // Duration in ticks (ish...-- 50ms) for cached chucks to live

    private static final int HASH_PRIME = 16777619;
    private static final int HASH_INIT = 0x811c9dc5;

    protected Thread cacheThread;
    protected ChunkLock loadingChunkLock = new ChunkLock();
    Logger log = LogManager.getLogger();
    Marker chunkCleaner = MarkerManager.getMarker("ChunkCleaner");
    private final Level world;

    public ParaServerChunkProvider(ServerLevel world, LevelStorageSource.LevelStorageAccess session, DataFixer dataFixer, StructureTemplateManager structureManager, Executor workerExecutor, ChunkGenerator chunkGenerator, int viewDistance, int simulationDistance, boolean dsync, ChunkProgressListener worldGenerationProgressListener, ChunkStatusUpdateListener chunkStatusChangeListener, Supplier<DimensionDataStorage> persistentStateManagerFactory) {
        super(world, session, dataFixer, structureManager, workerExecutor, chunkGenerator, viewDistance, simulationDistance, dsync, worldGenerationProgressListener, chunkStatusChangeListener, persistentStateManagerFactory);
        this.world = world;
        cacheThread = new Thread(this::chunkCacheCleanup, "Chunk Cache Cleaner " + world.dimension().location().getPath());
        cacheThread.start();
    }

    @SuppressWarnings("unused")
    private ChunkAccess getChunkyThing(long chunkPos, ChunkStatus requiredStatus, boolean load) {
    	ChunkAccess cl;
        synchronized (this) {
            cl = super.getChunk(ChunkPos.getX(chunkPos), ChunkPos.getZ(chunkPos), requiredStatus, load);
        }
        return cl;
    }

    @Override
    @Nullable
    public ChunkAccess getChunk(int chunkX, int chunkZ, ChunkStatus requiredStatus, boolean load) {

        if (GeneralConfig.disabled || GeneralConfig.disableChunkProvider) {
            if (ASMHookTerminator.isThreadPooled("Main", Thread.currentThread())) {
                return CompletableFuture.supplyAsync(() -> {
                    return this.getChunk(chunkX, chunkZ, requiredStatus, load);
                }, this.mainThreadProcessor).join();
            }
            return super.getChunk(chunkX, chunkZ, requiredStatus, load);
        }
        if (ASMHookTerminator.isThreadPooled("Main", Thread.currentThread())) {
            return CompletableFuture.supplyAsync(() -> {
                return this.getChunk(chunkX, chunkZ, requiredStatus, load);
            }, this.mainThreadProcessor).join();
        }

        long i = ChunkPos.asLong(chunkX, chunkZ);

        ChunkAccess c = lookupChunk(i, requiredStatus, false);
        if (c != null) {
            return c;
        }

        //log.debug("Missed chunk " + i + " on status "  + requiredStatus.toString());

        ChunkAccess cl;
        if (ASMHookTerminator.shouldThreadChunks()) {
            // Multithreaded but still limit to 1 load op per chunk
            long[] locks = loadingChunkLock.lock(i, 0);
            try {
                if ((c = lookupChunk(i, requiredStatus, false)) != null) {
                    return c;
                }
                cl = super.getChunk(chunkX, chunkZ, requiredStatus, load);
            } finally {
                loadingChunkLock.unlock(locks);
            }
        } else {
            synchronized (this) {
                if (chunkCache.containsKey(new ChunkCacheAddress(i, requiredStatus)) && (c = lookupChunk(i, requiredStatus, false)) != null) {
                    return c;
                }
                cl = super.getChunk(chunkX, chunkZ, requiredStatus, load);
            }
        }
        cacheChunk(i, cl, requiredStatus);
        return cl;
    }

    public ChunkAccess lookupChunk(long chunkPos, ChunkStatus status, boolean compute) {
        int oldAccess = access.getAndIncrement();
        if (access.get() < oldAccess) { // overflow
            clearCache();
            return null;
        }
        ChunkCacheLine ccl;
        ccl = chunkCache.get(new ChunkCacheAddress(chunkPos, status));
        if (ccl != null) {
            ccl.updateLastAccess();
            return ccl.getChunk();
        }
        return null;
    }

    public void cacheChunk(long chunkPos, ChunkAccess chunk, ChunkStatus status) {
        long oldAccess = access.getAndIncrement();
        if (access.get() < oldAccess) { // overflow
            clearCache();
        }

        ChunkCacheLine ccl;
        if ((ccl = chunkCache.get(new ChunkCacheAddress(chunkPos, status))) != null) {
            ccl.updateLastAccess();
            ccl.updateChunkRef(chunk);
        }
        ccl = new ChunkCacheLine(chunk);
        chunkCache.put(new ChunkCacheAddress(chunkPos, status), ccl);
    }

    public void chunkCacheCleanup() {
        while (world == null || world.getServer() == null) {
            log.debug(chunkCleaner, "ChunkCleaner Waiting for startup");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        while (world.getServer().isRunning()) {
            try {
                Thread.sleep(CACHE_DURATION_INTERVAL * CACHE_DURATION);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            clearCache();
        }
        log.debug(chunkCleaner, "ChunkCleaner terminating");
    }

    public void clearCache() {
        //log.info("Clearing Chunk Cache; Size: " + chunkCache.size());
        chunkCache.clear(); // Doesn't resize but that's typically good
    }

    protected class ChunkCacheAddress {
        protected long chunk_pos;
        protected int status;
        protected int hash;

        public ChunkCacheAddress(long chunk_pos, ChunkStatus status) {
            super();
            this.chunk_pos = chunk_pos;
            this.status = status.getIndex();
            this.hash = makeHash(this.chunk_pos, this.status);
        }

        @Override
        public int hashCode() {
            return hash;
        }

        @Override
        public boolean equals(Object obj) {
            return (obj instanceof ChunkCacheAddress)
                    && ((ChunkCacheAddress) obj).status == this.status
                    && ((ChunkCacheAddress) obj).chunk_pos == this.chunk_pos;
        }

        public int makeHash(long chunk_pos, int status) {
            int hash = HASH_INIT;
            hash ^= status;
            for (int b = 56; b >= 0; b -= 8) {
                hash ^= (chunk_pos >> b) & 0xff;
                hash *= HASH_PRIME;
            }
            return hash;
        }
    }

    protected class ChunkCacheLine {
        WeakReference<ChunkAccess> chunk;
        int lastAccess;

        public ChunkCacheLine(ChunkAccess chunk) {
            this(chunk, access.get());
        }

        public ChunkCacheLine(ChunkAccess chunk, int lastAccess) {
            this.chunk = new WeakReference<>(chunk);
            this.lastAccess = lastAccess;
        }

        public ChunkAccess getChunk() {
            return chunk.get();
        }

        public int getLastAccess() {
            return lastAccess;
        }

        public void updateLastAccess() {
            lastAccess = access.get();
        }

        public void updateChunkRef(ChunkAccess c) {
            if (chunk.get() == null) {
                chunk = new WeakReference<>(c);
            }
        }
    }
}
