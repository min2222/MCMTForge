package org.jmt.mcmt.mixin;

import java.util.List;
import java.util.Queue;
import java.util.concurrent.CopyOnWriteArrayList;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.jmt.mcmt.paralelised.fastutil.Long2ObjectOpenConcurrentHashMap;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import it.unimi.dsi.fastutil.longs.Long2ObjectMap;
import net.minecraft.world.ticks.LevelChunkTicks;
import net.minecraft.world.ticks.LevelTickAccess;
import net.minecraft.world.ticks.LevelTicks;
import net.minecraft.world.ticks.ScheduledTick;

@Mixin(LevelTicks.class)
public abstract class LevelTicksMixin<T> implements LevelTickAccess<T> {
    @Shadow
    @Final
    @Mutable
    private Long2ObjectMap<LevelChunkTicks<T>> allContainers = new Long2ObjectOpenConcurrentHashMap<>();

    @Shadow
    @Final
    @Mutable
    private Queue<LevelChunkTicks<T>> containersToTick = ConcurrentCollections.newArrayDeque();

    @Shadow
    @Final
    @Mutable
    private Queue<ScheduledTick<T>> toRunThisTick = ConcurrentCollections.newArrayDeque();

    @Shadow
    @Final
    @Mutable
    private List<ScheduledTick<T>> alreadyRunThisTick = new CopyOnWriteArrayList<>();
}
