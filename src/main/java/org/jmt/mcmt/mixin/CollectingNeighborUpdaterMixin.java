package org.jmt.mcmt.mixin;

import java.util.ArrayDeque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.CopyOnWriteArrayList;

import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

import net.minecraft.world.level.redstone.CollectingNeighborUpdater;
import net.minecraft.world.level.redstone.NeighborUpdater;

@Mixin(CollectingNeighborUpdater.class)
public abstract class CollectingNeighborUpdaterMixin implements NeighborUpdater {

    @Shadow
    @Final
    @Mutable
    ArrayDeque<CollectingNeighborUpdater.NeighborUpdates> stack = null;
    
    ConcurrentLinkedDeque<CollectingNeighborUpdater.NeighborUpdates> concurrentStack = new ConcurrentLinkedDeque<>();
	   
    @Shadow
    @Final
    @Mutable
    List<CollectingNeighborUpdater.NeighborUpdates> addedThisLayer = new CopyOnWriteArrayList<>();
    
    @Redirect(method = "addAndRun", at = @At(value = "INVOKE", target = "Ljava/util/ArrayDeque;push(Ljava/lang/Object;)V"))
    private <E> void overwriteaddAndRun(ArrayDeque instance, E e) {
        this.concurrentStack.push((CollectingNeighborUpdater.NeighborUpdates) e);
    }
    
    @Redirect(method = "runUpdates", at = @At(value = "INVOKE", target = "Ljava/util/ArrayDeque;isEmpty()Z"))
    private boolean overwriteisEmpty(ArrayDeque instance) {
        return this.concurrentStack.isEmpty();
    }
    
    @Redirect(method = "runUpdates", at = @At(value = "INVOKE", target = "Ljava/util/ArrayDeque;push(Ljava/lang/Object;)V"))
    private <E> void overwritepush(ArrayDeque instance, E e) {
        this.concurrentStack.push((CollectingNeighborUpdater.NeighborUpdates) e);
    }
    
    @Redirect(method = "runUpdates", at = @At(value = "INVOKE", target = "Ljava/util/ArrayDeque;peek()Ljava/lang/Object;"))
    private Object overwritepeek(ArrayDeque instance) {
        return this.concurrentStack.peek();
    }
    
    @Redirect(method = "runUpdates", at = @At(value = "INVOKE", target = "Ljava/util/ArrayDeque;pop()Ljava/lang/Object;"))
    private <E> E overwritepop(ArrayDeque instance) {
        return (E) this.concurrentStack.pop();
    }
    
    @Redirect(method = "runUpdates", at = @At(value = "INVOKE", target = "Ljava/util/ArrayDeque;clear()V"))
    private void overwriteclear(ArrayDeque instance) {
        this.concurrentStack.clear();
    }
}
