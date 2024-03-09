package org.jmt.mcmt.serdes.pools;

import java.util.function.Consumer;

import net.minecraft.core.BlockPos;
import net.minecraft.world.level.Level;

public class MainThreadExecutionPool implements ISerDesPool {

	@Override
	public void serialise(Runnable task, Object o, BlockPos bp, Level w, Consumer<Runnable> executeMultithreaded,
			ISerDesOptions options) {
		task.run();
	}
}
