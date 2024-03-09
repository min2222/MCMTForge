package org.jmt.mcmt.mixin;

import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Redirect;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelAccessor;
import net.minecraft.world.level.block.entity.TickingBlockEntity;

@Mixin(Level.class)
public abstract class LevelMixin implements LevelAccessor, AutoCloseable {
	
    @Shadow
    @Final
    @Mutable
    private Thread thread;
    
    @Inject(method = "tickBlockEntities", at = @At(value = "INVOKE", target = "Ljava/util/List;iterator()Ljava/util/Iterator;"))
    private void postEntityPreBlockEntityTick(CallbackInfo ci) {
        if ((Object) this instanceof ServerLevel) {
        	/*ServerLevel thisWorld = (ServerLevel) (Object) this;
            ASMHookTerminator.postEntityTick(thisWorld);
            ASMHookTerminator.preBlockEntityTick(thisWorld);*/
        }
    }

    @Inject(method = "tickBlockEntities", at = @At(value = "INVOKE", target = "Lnet/minecraft/util/profiling/ProfilerFiller;pop()V"))
    private void postBlockEntityTick(CallbackInfo ci) {
        if ((Object) this instanceof ServerLevel) {
        	//ServerLevel thisWorld = (ServerLevel) (Object) this;
        	//ASMHookTerminator.postBlockEntityTick(thisWorld);
        }
    }
    
    @Redirect(method = "tickBlockEntities", at = @At(value = "INVOKE", target = "Lnet/minecraft/world/level/block/entity/TickingBlockEntity;tick()V"))
    private void overwriteBlockEntityTick(TickingBlockEntity blockEntityTickInvoker) {
    	ASMHookTerminator.callBlockEntityTick(blockEntityTickInvoker, (Level) (Object) this);
    }
}
