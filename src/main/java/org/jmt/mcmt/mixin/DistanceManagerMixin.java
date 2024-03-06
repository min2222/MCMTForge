package org.jmt.mcmt.mixin;

import java.util.Set;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.jmt.mcmt.paralelised.fastutil.ConcurrentLongLinkedOpenHashSet;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import it.unimi.dsi.fastutil.longs.LongSet;
import net.minecraft.server.level.ChunkHolder;
import net.minecraft.server.level.DistanceManager;

@Mixin(DistanceManager.class)
public abstract class DistanceManagerMixin {

    @Shadow
    @Final
    @Mutable
    Set<ChunkHolder> chunksToUpdateFutures = ConcurrentCollections.newHashSet();

    @Shadow
    @Final
    @Mutable
    LongSet ticketsToRelease = new ConcurrentLongLinkedOpenHashSet();
}