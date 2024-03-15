package org.jmt.mcmt.mixin;

import java.util.Map;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.world.entity.ai.attributes.Attribute;
import net.minecraft.world.entity.ai.attributes.AttributeInstance;
import net.minecraft.world.entity.ai.attributes.AttributeMap;

@Mixin(AttributeMap.class)
public class AttributeMapMixin {
	
    @Mutable
    @Shadow
    @Final
    Map<Attribute, AttributeInstance> attributes = ConcurrentCollections.newHashMap();
}
