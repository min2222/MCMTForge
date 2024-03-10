package org.jmt.mcmt.mixin;

import java.util.function.BooleanSupplier;

import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Redirect;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import net.minecraft.commands.CommandSource;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.TickTask;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.thread.ReentrantBlockableEventLoop;

@Mixin(MinecraftServer.class)
public abstract class MinecraftServerMixin extends ReentrantBlockableEventLoop<TickTask> implements CommandSource, AutoCloseable {

    public MinecraftServerMixin(String p_18765_) {
		super(p_18765_);
	}

	@Inject(method = "tickChildren", at = @At(value = "INVOKE", target = "Lnet/minecraft/util/profiling/ProfilerFiller;push(Ljava/lang/String;)V"))
    private void preTick(BooleanSupplier shouldKeepTicking, CallbackInfo ci) {
    	ASMHookTerminator.preTick((MinecraftServer) (Object) this);
    }

    @Inject(method = "tickChildren", at = @At(value = "INVOKE", target = "Lnet/minecraft/util/profiling/ProfilerFiller;popPush(Ljava/lang/String;)V", ordinal = 1))
    private void postTick(BooleanSupplier shouldKeepTicking, CallbackInfo ci) {
    	ASMHookTerminator.postTick((MinecraftServer) (Object) this);
    }

    @Redirect(method = "tickChildren", at = @At(value = "INVOKE", target = "Lnet/minecraft/server/level/ServerLevel;tick(Ljava/util/function/BooleanSupplier;)V"))
    private void overwriteTick(ServerLevel serverWorld, BooleanSupplier shouldKeepTicking) {
        ASMHookTerminator.callTick(serverWorld, shouldKeepTicking, (MinecraftServer) (Object) this);
    }
}
