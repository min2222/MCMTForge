package org.jmt.mcmt.mixin;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.objectweb.asm.Opcodes;
import org.objectweb.asm.tree.ClassNode;
import org.objectweb.asm.tree.MethodNode;
import org.spongepowered.asm.mixin.extensibility.IMixinConfigPlugin;
import org.spongepowered.asm.mixin.extensibility.IMixinInfo;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;

public class SynchronisePlugin implements IMixinConfigPlugin {
	
    private static final Logger syncLogger = LogManager.getLogger();
    private final Multimap<String, String> mixin2MethodsMap = ArrayListMultimap.create();
    private final Multimap<String, String> mixin2MethodsExcludeMap = ArrayListMultimap.create();
    private final TreeSet<String> syncAllSet = new TreeSet<>();

    @Override
    public void onLoad(String mixinPackage) {
        mixin2MethodsMap.put("com.min01.mcmtforge.mixin.CollectingNeighborUpdaterMixin", "addAndRun");
        mixin2MethodsMap.put("com.min01.mcmtforge.mixin.ServerChunkCacheMixin", "storeInCache");
        mixin2MethodsMap.put("com.min01.mcmtforge.mixin.PathFinderMixin", "findPath");
        mixin2MethodsExcludeMap.put("com.min01.mcmtforge.mixin.SyncAllMixin", "isOrAfter");

        syncAllSet.add("com.min01.mcmtforge.mixin.FastUtilsMixin");
        syncAllSet.add("com.min01.mcmtforge.mixin.SyncAllMixin");
        syncAllSet.add("com.min01.mcmtforge.mixin.LegacyRandomSourceMixin");
    }

    @Override
    public String getRefMapperConfig() {
        return null;
    }

    @Override
    public boolean shouldApplyMixin(String targetClassName, String mixinClassName) {
        return true;
    }

    @Override
    public void acceptTargets(Set<String> myTargets, Set<String> otherTargets) {

    }

    @Override
    public List<String> getMixins() {
        return null;
    }

    @Override
    public void preApply(String targetClassName, ClassNode targetClass, String mixinClassName, IMixinInfo mixinInfo) {

    }

    @Override
    public void postApply(String targetClassName, ClassNode targetClass, String mixinClassName, IMixinInfo mixinInfo) {
        Collection<String> targetMethods = mixin2MethodsMap.get(mixinClassName);
        Collection<String> excludedMethods = mixin2MethodsExcludeMap.get(mixinClassName);
        if (targetMethods.size() != 0) for (MethodNode method : targetClass.methods) {
            for (String targetMethod : targetMethods) {
                if (method.name.equals(targetMethod)) {
                    method.access |= Opcodes.ACC_SYNCHRONIZED;
                    syncLogger.info("Setting synchronize bit for " + method.name + " in " + targetClassName + ".");
                }
            }
        }
        else if (syncAllSet.contains(mixinClassName)) {
            int negFilter = Opcodes.ACC_STATIC | Opcodes.ACC_SYNTHETIC | Opcodes.ACC_NATIVE | Opcodes.ACC_ABSTRACT | Opcodes.ACC_BRIDGE;

            for (MethodNode method : targetClass.methods) {
                if ((method.access & negFilter) == 0 && !method.name.equals("<init>") && !excludedMethods.contains(method.name)) {
                    method.access |= Opcodes.ACC_SYNCHRONIZED;
                    syncLogger.info("Setting synchronize bit for " + method.name + " in " + targetClassName + ".");
                }
            }
        }
    }
}