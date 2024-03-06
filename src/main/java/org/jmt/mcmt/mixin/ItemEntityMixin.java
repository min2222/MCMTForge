package org.jmt.mcmt.mixin;

import java.util.concurrent.locks.ReentrantLock;

import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import net.minecraft.world.entity.item.ItemEntity;

@Mixin(ItemEntity.class)
public class ItemEntityMixin {
	
    private static final ReentrantLock lock = new ReentrantLock();

    @Inject(method="mergeWithNeighbours()V",at=@At(value="HEAD"))
    private void lock(CallbackInfo ci) {
        lock.lock();
    }

    @Inject(method="mergeWithNeighbours()V",at=@At(value="RETURN"))
    private void unlock(CallbackInfo ci) {
        lock.unlock();
    }
}
