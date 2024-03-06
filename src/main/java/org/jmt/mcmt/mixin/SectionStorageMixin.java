package org.jmt.mcmt.mixin;

import java.util.Optional;

import org.jmt.mcmt.paralelised.fastutil.ConcurrentLongLinkedOpenHashSet;
import org.jmt.mcmt.paralelised.fastutil.Long2ObjectConcurrentHashMap;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import it.unimi.dsi.fastutil.longs.Long2ObjectMap;
import it.unimi.dsi.fastutil.longs.LongLinkedOpenHashSet;
import net.minecraft.world.level.chunk.storage.SectionStorage;

@Mixin(SectionStorage.class)
public abstract class SectionStorageMixin<R> implements AutoCloseable {
	
    @Shadow
    @Final
    @Mutable
    private Long2ObjectMap<Optional<R>> storage = new Long2ObjectConcurrentHashMap<>();

    @Shadow
    @Final
    @Mutable
    private LongLinkedOpenHashSet dirty = new ConcurrentLongLinkedOpenHashSet();
}
