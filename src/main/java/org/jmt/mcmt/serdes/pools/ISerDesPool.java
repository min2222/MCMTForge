package org.jmt.mcmt.serdes.pools;

import java.util.Map;
import java.util.function.Consumer;

import javax.annotation.Nullable;

import net.minecraft.core.BlockPos;
import net.minecraft.world.level.Level;

public interface ISerDesPool {

	public interface ISerDesOptions {}
	
	public void serialise(Runnable task, Object o, BlockPos bp, Level w, 
			Consumer<Runnable> executeMultithreaded, @Nullable ISerDesOptions options);
	
	public default ISerDesOptions compileOptions(Map<String, Object> config) {
		return null;
	}
	
	public default void init(String name, Map<String, Object> config) {
		
	}
	
}
