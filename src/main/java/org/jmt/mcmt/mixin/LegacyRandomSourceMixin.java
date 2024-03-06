package org.jmt.mcmt.mixin;

import org.spongepowered.asm.mixin.Mixin;

import net.minecraft.world.level.levelgen.LegacyRandomSource;

@Mixin(LegacyRandomSource.class)
public abstract class LegacyRandomSourceMixin {
}
