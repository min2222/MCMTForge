package org.jmt.mcmt.mixin;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.world.level.redstone.CollectingNeighborUpdater;
import net.minecraft.world.level.redstone.NeighborUpdater;

@Mixin(CollectingNeighborUpdater.class)
public abstract class CollectingNeighborUpdaterMixin implements NeighborUpdater {

    @Shadow
    @Final
    @Mutable
    List<CollectingNeighborUpdater.NeighborUpdates> addedThisLayer = new CopyOnWriteArrayList<>();
}
