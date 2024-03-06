package org.jmt.mcmt.mixin;

import org.jmt.mcmt.paralelised.fastutil.ConcurrentShortHashSet;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Redirect;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import it.unimi.dsi.fastutil.shorts.ShortSet;
import net.minecraft.server.level.ChunkHolder;
import net.minecraft.world.level.ChunkPos;
import net.minecraft.world.level.LevelHeightAccessor;
import net.minecraft.world.level.lighting.LevelLightEngine;

@Mixin(ChunkHolder.class)
public abstract class ChunkHolderMixin {

    @Mutable
    @Shadow
    @Final
    private ShortSet[] changedBlocksPerSection;

    @Inject(method = "<init>", at = @At(value = "TAIL", target = "Lnet/minecraft/server/level/ChunkHolder;changedBlocksPerSection:[Lit/unimi/dsi/fastutil/shorts/ShortSet;"))
    private void overwriteShortSet(ChunkPos pos, int level, LevelHeightAccessor world, LevelLightEngine lightingProvider, ChunkHolder.LevelChangeListener levelUpdateListener, ChunkHolder.PlayerProvider playersWatchingChunkProvider, CallbackInfo ci) {
        this.changedBlocksPerSection = new ConcurrentShortHashSet[world.getSectionsCount()];
    }

    @Redirect(method = "blockChanged", at = @At(value = "FIELD", target = "Lnet/minecraft/server/level/ChunkHolder;changedBlocksPerSection:[Lit/unimi/dsi/fastutil/shorts/ShortSet;", args = "array=set"))
    private void setBlockUpdatesBySection(ShortSet[] array, int index, ShortSet value) {
        array[index] = new ConcurrentShortHashSet();
    }
}
