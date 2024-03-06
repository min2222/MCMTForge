package org.jmt.mcmt.mixin;

import java.util.Map;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.core.BlockPos;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.chunk.ChunkAccess;

@Mixin(ChunkAccess.class)
public class ChunkAccessMixin {
    @Shadow
    @Final
    @Mutable
    private Map<BlockPos, BlockEntity> blockEntities =  ConcurrentCollections.newHashMap();
}
