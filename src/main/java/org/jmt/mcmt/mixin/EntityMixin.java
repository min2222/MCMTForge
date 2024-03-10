package org.jmt.mcmt.mixin;

import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.Entity;

@Mixin(Entity.class)
public class EntityMixin {

	@SuppressWarnings("deprecation")
	@Shadow
	public RandomSource random = RandomSource.createThreadSafe();
}
