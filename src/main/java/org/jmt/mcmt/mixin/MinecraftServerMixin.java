package org.jmt.mcmt.mixin;

import java.util.Map;
import java.util.function.BooleanSupplier;

import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.jmt.mcmt.asmdest.DebugHookTerminator;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Redirect;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import com.google.common.collect.Maps;

import net.minecraft.commands.CommandSource;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.TickTask;
import net.minecraft.server.level.ServerChunkCache;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.thread.ReentrantBlockableEventLoop;
import net.minecraft.world.level.Level;

@Mixin(MinecraftServer.class)
public abstract class MinecraftServerMixin extends ReentrantBlockableEventLoop<TickTask> implements CommandSource, AutoCloseable {
	
    @Shadow
    public abstract ServerLevel overworld();
    
	@Shadow
	@Final Map<ResourceKey<Level>, ServerLevel> levels = Maps.newLinkedHashMap();
	
    public MinecraftServerMixin(String p_18765_) {
		super(p_18765_);
	}

	@Inject(method = "tickChildren", at = @At(value = "INVOKE", target = "Lnet/minecraft/util/profiling/ProfilerFiller;push(Ljava/lang/String;)V"))
    private void preTick(BooleanSupplier shouldKeepTicking, CallbackInfo ci) {
    	ASMHookTerminator.preTick(this.levels.size(), (MinecraftServer) (Object) this);
    }

    @Inject(method = "tickChildren", at = @At(value = "INVOKE", target = "Lnet/minecraft/util/profiling/ProfilerFiller;popPush(Ljava/lang/String;)V", ordinal = 1))
    private void postTick(BooleanSupplier shouldKeepTicking, CallbackInfo ci) {
    	ASMHookTerminator.postTick((MinecraftServer) (Object) this);
    }

    @Redirect(method = "tickChildren", at = @At(value = "INVOKE", target = "Lnet/minecraft/server/level/ServerLevel;tick(Ljava/util/function/BooleanSupplier;)V"))
    private void overwriteTick(ServerLevel serverWorld, BooleanSupplier shouldKeepTicking) {
        ASMHookTerminator.callTick(serverWorld, shouldKeepTicking, (MinecraftServer) (Object) this);
    }
    
    @Redirect(method = "prepareLevels", at = @At(value = "INVOKE", target = "Lnet/minecraft/server/level/ServerChunkCache;getTickingGenerated()I"))
    private int initialChunkCountBypass(ServerChunkCache instance) {
        if (DebugHookTerminator.isBypassLoadTarget())
            return 441;
        int loaded = this.overworld().getChunkSource().getTickingGenerated();
        return Math.min(loaded, 441); // Maybe because multi loading caused overflow
    }
}
