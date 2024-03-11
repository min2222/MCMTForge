package org.jmt.mcmt.mixin;

import java.util.Map;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.LivingEntity;

@Mixin(LivingEntity.class)
public class LivingEntityMixin {
	
    @Final
    @Shadow
    @Mutable
	Map<MobEffect, MobEffectInstance> activeEffects = ConcurrentCollections.newHashMap();
}
