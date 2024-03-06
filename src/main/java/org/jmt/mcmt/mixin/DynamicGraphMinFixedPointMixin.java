package org.jmt.mcmt.mixin;

import org.jmt.mcmt.paralelised.fastutil.ConcurrentLongLinkedOpenHashSet;
import org.jmt.mcmt.paralelised.fastutil.Long2ByteConcurrentHashMap;
import org.objectweb.asm.Opcodes;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

import it.unimi.dsi.fastutil.longs.Long2ByteMap;
import it.unimi.dsi.fastutil.longs.LongLinkedOpenHashSet;
import net.minecraft.world.level.lighting.DynamicGraphMinFixedPoint;

@Mixin(DynamicGraphMinFixedPoint.class)
public abstract class DynamicGraphMinFixedPointMixin {

    @Final
    @Shadow
    @Mutable
    Long2ByteMap computedLevels;

    @Redirect(method = "<init>", at = @At(value = "FIELD", target = "Lnet/minecraft/world/level/lighting/DynamicGraphMinFixedPoint;queues:[Lit/unimi/dsi/fastutil/longs/LongLinkedOpenHashSet;", args = "array=set"))
    private void overwritePendingIdUpdatesByLevel(LongLinkedOpenHashSet[] hashSets, int index, LongLinkedOpenHashSet hashSet, int levelCount, final int expectedLevelSize, final int expectedTotalSize) {
        hashSets[index] = new ConcurrentLongLinkedOpenHashSet(expectedLevelSize, 0.5f) {
            @Override
            protected void rehash(int newN) {
                if (newN > expectedLevelSize) {
                    super.rehash(newN);
                }
            }
        };
    }

    @Redirect(method = "<init>", at = @At(value = "FIELD", target = "Lnet/minecraft/world/level/lighting/DynamicGraphMinFixedPoint;computedLevels:Lit/unimi/dsi/fastutil/longs/Long2ByteMap;", opcode = Opcodes.PUTFIELD))
    private void overwritePendingUpdates(DynamicGraphMinFixedPoint instance, Long2ByteMap value, int levelCount, final int expectedLevelSize, final int expectedTotalSize) {
    	computedLevels = new Long2ByteConcurrentHashMap(expectedTotalSize, 0.5f);
    }
}
