package org.jmt.mcmt.serdes.filter;

import java.util.function.Consumer;

import org.jmt.mcmt.serdes.ISerDesHookType;

import net.minecraft.core.BlockPos;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.piston.PistonMovingBlockEntity;

public class VanillaFilter implements ISerDesFilter {

	@Override
	public void serialise(Runnable task, Object obj, BlockPos bp, Level w, 
			Consumer<Runnable> executeMultithreaded, ISerDesHookType hookType) {
		executeMultithreaded.accept(task);
	}

	@Override
	public ClassMode getModeOnline(Class<?> c) {
		if (c.getName().startsWith("net.minecraft") && !c.equals(PistonMovingBlockEntity.class)) {
			return ClassMode.ALWAYS_ASYNC;
		}
		return ClassMode.UNKNOWN;
	}
	
}
