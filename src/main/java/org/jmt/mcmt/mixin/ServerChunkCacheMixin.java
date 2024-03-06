package org.jmt.mcmt.mixin;

import java.util.concurrent.CompletableFuture;

import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.jmt.mcmt.asmdest.DebugHookTerminator;
import org.objectweb.asm.Opcodes;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Redirect;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;
import org.spongepowered.asm.mixin.injection.callback.LocalCapture;

import com.mojang.datafixers.util.Either;

import net.minecraft.server.level.ChunkHolder;
import net.minecraft.server.level.ServerChunkCache;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.profiling.ProfilerFiller;
import net.minecraft.world.level.chunk.ChunkAccess;
import net.minecraft.world.level.chunk.ChunkSource;
import net.minecraft.world.level.chunk.ChunkStatus;
import net.minecraft.world.level.chunk.LevelChunk;

@Mixin(ServerChunkCache.class)
public abstract class ServerChunkCacheMixin extends ChunkSource {
    @Shadow
    @Final
    ServerChunkCache.MainThreadExecutor mainThreadProcessor;
    
	@Shadow
	@Final ServerLevel level;
	
    @Inject(method = "tickChunks", at = @At(value = "INVOKE", target = "Ljava/util/Collections;shuffle(Ljava/util/List;)V"))
    private void preChunkTick(CallbackInfo ci) {
        ASMHookTerminator.preChunkTick(this.level);
    }
    
    @Redirect(method = "tickChunks", at = @At(value = "INVOKE", target = "Lnet/minecraft/server/level/ServerLevel;tickChunk(Lnet/minecraft/world/level/chunk/LevelChunk;I)V"))
    private void overwriteTickChunk(ServerLevel serverWorld, LevelChunk chunk, int randomTickSpeed) {
    	ASMHookTerminator.callTickChunks(serverWorld, chunk, randomTickSpeed);
    }
    
    @Redirect(method = {"getChunk(IILnet/minecraft/world/level/chunk/ChunkStatus;Z)Lnet/minecraft/world/level/chunk/ChunkAccess;", "getChunkNow"}, at = @At(value = "FIELD", target = "Lnet/minecraft/server/level/ServerChunkCache;mainThread:Ljava/lang/Thread;", opcode = Opcodes.GETFIELD))
    private Thread overwriteServerThread(ServerChunkCache mgr) {
        return Thread.currentThread();
    }
    
    @Redirect(method = "getChunk(IILnet/minecraft/world/level/chunk/ChunkStatus;Z)Lnet/minecraft/world/level/chunk/ChunkAccess;", at = @At(value = "INVOKE", target = "Lnet/minecraft/util/profiling/ProfilerFiller;incrementCounter(Ljava/lang/String;)V"))
    private void overwriteProfilerVisit(ProfilerFiller instance, String s) {
        if (ASMHookTerminator.shouldThreadChunks())
            return;
        else instance.incrementCounter("getChunkCacheMiss");
    }
    
    @Inject(method = "getChunk(IILnet/minecraft/world/level/chunk/ChunkStatus;Z)Lnet/minecraft/world/level/chunk/ChunkAccess;", at = @At(value = "INVOKE", target = "Lnet/minecraft/server/level/ServerChunkCache$MainThreadExecutor;managedBlock(Ljava/util/function/BooleanSupplier;)V"), locals = LocalCapture.CAPTURE_FAILHARD)
    private void callCompletableFutureHook(int x, int z, ChunkStatus leastStatus, boolean create, CallbackInfoReturnable<ChunkAccess> cir, ProfilerFiller profiler, long chunkPos, CompletableFuture<Either<ChunkAccess, ChunkHolder.ChunkLoadingFailure>> i) {
        DebugHookTerminator.chunkLoadDrive(this.mainThreadProcessor, i::isDone, (ServerChunkCache) (Object) this, i, chunkPos);
    }
}
