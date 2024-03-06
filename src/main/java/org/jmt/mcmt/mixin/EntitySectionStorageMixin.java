package org.jmt.mcmt.mixin;

import org.jmt.mcmt.paralelised.fastutil.ConcurrentLongSortedSet;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import it.unimi.dsi.fastutil.longs.LongSortedSet;
import net.minecraft.world.level.entity.EntityAccess;
import net.minecraft.world.level.entity.EntitySectionStorage;

@Mixin(EntitySectionStorage.class)
public abstract class EntitySectionStorageMixin<T extends EntityAccess> {
	
    @Shadow
    @Final
    @Mutable
    private LongSortedSet sectionIds = new ConcurrentLongSortedSet();
}
