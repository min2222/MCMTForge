package org.jmt.mcmt.mixin;

import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinWorkerThread;

import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;
import org.spongepowered.asm.mixin.injection.callback.LocalCapture;

import net.minecraft.Util;

@Mixin(Util.class)
public class UtilMixin {
	//m_201861_
    //lambda$makeExecutor$3
    @Inject(method = "m_201861_", at = @At(value = "INVOKE", target = "Ljava/util/concurrent/ForkJoinWorkerThread;setName(Ljava/lang/String;)V"), locals = LocalCapture.CAPTURE_FAILHARD)
    private static void registerThread(String string, ForkJoinPool forkJoinPool, CallbackInfoReturnable<ForkJoinWorkerThread> cir, ForkJoinWorkerThread forkJoinWorkerThread) {
        ASMHookTerminator.regThread(string, forkJoinWorkerThread);
    }
}
