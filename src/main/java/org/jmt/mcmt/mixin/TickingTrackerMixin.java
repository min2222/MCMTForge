package org.jmt.mcmt.mixin;

import org.jmt.mcmt.paralelised.fastutil.Long2ByteConcurrentHashMap;
import org.jmt.mcmt.paralelised.fastutil.Long2ObjectOpenConcurrentHashMap;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import it.unimi.dsi.fastutil.longs.Long2ByteMap;
import it.unimi.dsi.fastutil.longs.Long2ObjectOpenHashMap;
import net.minecraft.server.level.ChunkTracker;
import net.minecraft.server.level.Ticket;
import net.minecraft.server.level.TickingTracker;
import net.minecraft.util.SortedArraySet;

@Mixin(TickingTracker.class)
public abstract class TickingTrackerMixin extends ChunkTracker {
    @Shadow
    @Final
    @Mutable
    protected Long2ByteMap chunks = new Long2ByteConcurrentHashMap();

    @Shadow
    @Final
    @Mutable
    private Long2ObjectOpenHashMap<SortedArraySet<Ticket<?>>> tickets = new Long2ObjectOpenConcurrentHashMap<>();

    protected TickingTrackerMixin(int i, int j, int k) {
        super(i, j, k);
    }
}
