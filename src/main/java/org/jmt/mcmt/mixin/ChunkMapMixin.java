package org.jmt.mcmt.mixin;

import java.nio.file.Path;

import org.jmt.mcmt.paralelised.fastutil.Int2ObjectConcurrentHashMap;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import com.mojang.datafixers.DataFixer;

import it.unimi.dsi.fastutil.ints.Int2ObjectMap;
import net.minecraft.server.level.ChunkHolder;
import net.minecraft.server.level.ChunkMap;
import net.minecraft.world.level.chunk.storage.ChunkStorage;

@Mixin(ChunkMap.class)
public abstract class ChunkMapMixin extends ChunkStorage implements ChunkHolder.PlayerProvider {

    public ChunkMapMixin(Path p_196912_, DataFixer p_196913_, boolean p_196914_) {
		super(p_196912_, p_196913_, p_196914_);
	}

	@Shadow
    @Final
    @Mutable
    private Int2ObjectMap<ChunkMap.TrackedEntity> entityMap = new Int2ObjectConcurrentHashMap<>();
}
