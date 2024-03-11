function synchronizeMethod(debugLine) {
	return function(methodNode) {
		var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
		
		asmapi.log("INFO", "[JMTSUPERTRANS] " + debugLine + " Transformer Called");
		
		var opcodes = Java.type('org.objectweb.asm.Opcodes');
		
		methodNode.access += opcodes.ACC_SYNCHRONIZED;
		
		asmapi.log("INFO", "[JMTSUPERTRANS] " + debugLine + " Transformer Complete");
		
		return methodNode;
	}
}

function printInsnNode(printTgt) {
	print(printTgt+"|"+printTgt.opcode
			+"|"+printTgt.desc+"|"+printTgt.owner+"|"+printTgt.name+"|"+printTgt["var"])
}

function toParallelHashSets(methodNode) {
	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
	var MethodType = asmapi.MethodType;
	var instructions = methodNode.instructions;
		
	var callMethod = "newHashSet";
	var callClass = "com/google/common/collect/Sets";
	var callDesc = "()Ljava/util/HashSet;";
	
	var tgtMethod = "newHashSet";
	var tgtClass = "org/jmt/mcmt/asmdest/ConcurrentCollections";
	var tgtDesc = "()Ljava/util/Set;";
	
	var invoke = asmapi.findFirstMethodCallAfter(methodNode, MethodType.STATIC, callClass, callMethod, callDesc, 0);
	if (invoke != null) {
		do {
			asmapi.log("INFO", "[JMTSUPERTRANS] toParallelHashSets Transforming");
			invoke.owner = tgtClass;
			invoke.name = tgtMethod;
			invoke.desc = tgtDesc;
		} while ((invoke = asmapi.findFirstMethodCallAfter(methodNode, 
				MethodType.STATIC, callClass, callMethod, callDesc, instructions.indexOf(invoke))) != null)
	}
}

function toParallelHashMaps(methodNode) {
	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
	var MethodType = asmapi.MethodType;
	var instructions = methodNode.instructions;
	
	var callMethod = "newHashMap";
	var callClass = "com/google/common/collect/Maps";
	var callDesc = "()Ljava/util/HashMap;";
	
	var tgtMethod = "newHashMap";
	var tgtClass = "org/jmt/mcmt/asmdest/ConcurrentCollections";
	var tgtDesc = "()Ljava/util/Map;";
	
	var invoke = asmapi.findFirstMethodCallAfter(methodNode, MethodType.STATIC, callClass, callMethod, callDesc, 0);
	if (invoke != null) {
		do {
			asmapi.log("INFO", "[JMTSUPERTRANS] toParallelHashMaps Transforming");
			invoke.owner = tgtClass;
			invoke.name = tgtMethod;
			invoke.desc = tgtDesc;
		} while ((invoke = asmapi.findFirstMethodCallAfter(methodNode, 
				MethodType.STATIC, callClass, callMethod, callDesc, instructions.indexOf(invoke))) != null)
	}
}

function toParallelDeque(methodNode) {
	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
	var MethodType = asmapi.MethodType;
	var instructions = methodNode.instructions;
	
	//com/google/common/collect/Queues.newArrayDeque()Ljava/util/ArrayDeque;
	var callMethod = "newArrayDeque";
	var callClass = "com/google/common/collect/Queues";
	var callDesc = "()Ljava/util/ArrayDeque;";
	
	var tgtMethod = "newArrayDeque";
	var tgtClass = "org/jmt/mcmt/asmdest/ConcurrentCollections";
	var tgtDesc = "()Ljava/util/Queue;";
	
	var invoke = asmapi.findFirstMethodCallAfter(methodNode, MethodType.STATIC, callClass, callMethod, callDesc, 0);
	if (invoke != null) {
		do {
			asmapi.log("INFO", "[JMTSUPERTRANS] toParallelHashSets Transforming");
			invoke.owner = tgtClass;
			invoke.name = tgtMethod;
			invoke.desc = tgtDesc;
		} while ((invoke = asmapi.findFirstMethodCallAfter(methodNode, 
				MethodType.STATIC, callClass, callMethod, callDesc, instructions.indexOf(invoke))) != null)
	}
}


function initializeCoreMod() {
    return {
    	'serverChunkProviderTick': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.server.level.ServerChunkCache',
                "methodName": "m_8490_",
        		"methodDesc": "()V"
            },
            "transformer": synchronizeMethod("SCPTick")
    	},
    	'ServerWorldCollections': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.server.level.ServerLevel',
                "methodName": "<init>",
        		"methodDesc": "(Lnet/minecraft/server/MinecraftServer;Ljava/util/concurrent/Executor;Lnet/minecraft/world/level/storage/LevelStorageSource$LevelStorageAccess;Lnet/minecraft/world/level/storage/ServerLevelData;Lnet/minecraft/resources/ResourceKey;Lnet/minecraft/world/level/dimension/LevelStem;Lnet/minecraft/server/level/progress/ChunkProgressListener;ZJLjava/util/List;Z)V"
            },
            "transformer": function(methodNode) {
            	print("[JMTSUPERTRANS] ServerWorldCollections Transformer Called");
            	
            	toParallelHashSets(methodNode);
				toParallelDeque(methodNode);
            	
            	print("[JMTSUPERTRANS] ServerWorldCollections Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	//onBlockStateChange
    	'ServerWorldOnBlockStateChange': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.server.level.ServerLevel',
                "methodName": "m_6559_ ",
                "methodDesc": "(Lnet/minecraft/core/BlockPos;Lnet/minecraft/world/level/block/BlockState;Lnet/minecraft/world/level/block/BlockState;)V"
            },
            "transformer": synchronizeMethod("ServerWorldOnBlockStateChange")
    	},
    	'POIManager_func_219149_a_': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.entity.ai.village.poi.PoiManager',
                "methodName": "m_217884_",
        		"methodDesc": "(Lnet/minecraft/world/level/ChunkPos;Ljava/lang/Integer;)Ljava/util/Optional"
            },
            "transformer": synchronizeMethod("POIManager_func_219149_a_")
    	},
		'TemplateManagerHashMap': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplateManager',
                "methodName": "<init>",
        		"methodDesc": "(Lnet/minecraft/server/packs/resources/ResourceManager;Lnet/minecraft/world/level/storage/LevelStorageSource$LevelStorageAccess;Lcom/mojang/datafixers/DataFixer;)V"
            },
            "transformer": function(methodNode) {
				var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	asmapi.log("INFO", "[JMTSUPERTRANS] TemplateManagerHashMap Transformer Called");
            	
            	toParallelHashMaps(methodNode);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] TemplateManagerHashMap Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'TicketManagerCollections': {
			'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.server.level.DistanceManager'
            },
            "transformer": function(classNode) {
	            var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	asmapi.log("INFO", "[JMTSUPERTRANS] TicketManagerCollections Transformer Called");
            	
				for (methodid in classNode.methods) {
					var methodNode = classNode.methods[methodid];
					if (methodNode.name != "<init>") {
    					continue;
    				}
					asmapi.log("INFO", "[JMTSUPERTRANS] TicketManagerCollections Hit Init");

					toParallelHashMaps(methodNode);
					toParallelDeque(methodNode);
					toParallelHashSets(methodNode);
				}
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] TicketManagerCollections Transformer Complete");
            	
            	return classNode;
            }
		},
		'ThreadTaskExecutorCollections': {
			'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.util.thread.BlockableEventLoop'
            },
            "transformer": function(classNode) {
	            var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	asmapi.log("INFO", "[JMTSUPERTRANS] ThreadTaskExecutorCollections Transformer Called");
            	
				for (methodid in classNode.methods) {
					var methodNode = classNode.methods[methodid];
					if (methodNode.name != "<init>") {
    					continue;
    				}
					asmapi.log("INFO", "[JMTSUPERTRANS] ThreadTaskExecutorCollections Hit Init");
					/*
					var insn = methodNode.instructions.getFirst();
					while (insn != null) {
						printInsnNode(insn);
						insn = insn.getNext();
					}
					*/
					toParallelHashMaps(methodNode);
					toParallelDeque(methodNode);
					toParallelHashSets(methodNode);
				}
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] ThreadTaskExecutorCollections Transformer Complete");
            	
            	return classNode;
            }
		}
    }
}