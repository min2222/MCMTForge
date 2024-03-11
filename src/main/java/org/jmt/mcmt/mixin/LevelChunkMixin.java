package org.jmt.mcmt.mixin;

import org.jmt.mcmt.paralelised.fastutil.Int2ObjectConcurrentHashMap;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import it.unimi.dsi.fastutil.ints.Int2ObjectMap;
import net.minecraft.world.level.chunk.LevelChunk;
import net.minecraft.world.level.gameevent.GameEventDispatcher;

@Mixin(LevelChunk.class)
public class LevelChunkMixin {
	
    @Mutable
    @Shadow
    @Final
    Int2ObjectMap<GameEventDispatcher> gameEventDispatcherSections = new Int2ObjectConcurrentHashMap<>();
}
