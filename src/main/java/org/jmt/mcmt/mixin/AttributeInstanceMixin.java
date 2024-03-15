package org.jmt.mcmt.mixin;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.world.entity.ai.attributes.AttributeInstance;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;

@Mixin(AttributeInstance.class)
public class AttributeInstanceMixin {
	
    @Mutable
    @Shadow
    @Final
	Map<UUID, AttributeModifier> modifierById = ConcurrentCollections.newHashMap();
    
    @Mutable
    @Shadow
    @Final
    Set<AttributeModifier> permanentModifiers = ConcurrentCollections.newHashSet();
}
