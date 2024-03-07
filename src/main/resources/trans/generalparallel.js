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

function synchronizeClass(debugLine) {
	return function(classNode) {
		var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
		var opcodes = Java.type('org.objectweb.asm.Opcodes');
		
		
		var posfilter = opcodes.ACC_PUBLIC;
		var negfilter = opcodes.ACC_STATIC | opcodes.ACC_SYNTHETIC | opcodes.ACC_NATIVE | opcodes.ACC_ABSTRACT
			| opcodes.ACC_ABSTRACT | opcodes.ACC_BRIDGE;
		
		asmapi.log("INFO", "[JMTSUPERTRANS] " + debugLine + " Transformer Called");
		
		for (var i in classNode.methods) {
			var methodNode = classNode.methods[i];
			if ((methodNode.access & posfilter) == posfilter && (methodNode.access & negfilter) == 0 && !methodNode.name.equals("<init>")) {
				asmapi.log("INFO", "[JMTSUPERTRANS] " + debugLine + " Transformer Hit " + methodNode.name);
				methodNode.access += opcodes.ACC_SYNCHRONIZED;
			}
		}
		
		asmapi.log("INFO", "[JMTSUPERTRANS] " + debugLine + " Transformer Complete");
		
		return classNode;
	}
}

function initializeCoreMod() {
    return {
			'PalettedContainerReLock': {
    		'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.world.level.chunk.PalettedContainer'
            },
            "transformer": function(classNode) {
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
				var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
				var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
				var JumpInsnNode = Java.type("org.objectweb.asm.tree.JumpInsnNode");
				var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
				var MethodType = asmapi.MethodType;
				
				asmapi.log("INFO", "[JMTSUPERTRANS] PalettedContainerReLock Transformer Called");
            	
				var methods = classNode.methods;
            	
            	var targetMethodLock = asmapi.mapMethod("m_63084_");
				var targetMethodFree = asmapi.mapMethod("m_63120_"); 
            	var targetMethodDesc = "()V"; // Remember that these are non static so still eat a ref

				for (var i in methods) {
            		var method = methods[i];

					if (method.name.equals(targetMethodLock) || method.name.equals(targetMethodFree)) {
						//don't patch targets'
						continue;
					}
					
					var instructions = method.instructions;
					
					var currentIdx = 0;
					var lockref = asmapi.findFirstMethodCallAfter(method, MethodType.VIRTUAL, classNode.name, 
													targetMethodLock, targetMethodDesc, currentIdx);
					
					while (lockref != null) {
						var skipTarget = new LabelNode();
						var il = new InsnList();
            			il.add(new VarInsnNode(opcodes.ALOAD, 0));
						il.add(new InsnNode(opcodes.MONITORENTER));
						il.add(new JumpInsnNode(opcodes.GOTO, skipTarget));
						instructions.insertBefore(lockref, il);
        				instructions.insert(lockref, skipTarget);
						currentIdx = instructions.indexOf(lockref)+1;
						lockref = asmapi.findFirstMethodCallAfter(method, MethodType.VIRTUAL, classNode.name, 
													targetMethodLock, targetMethodDesc, currentIdx);
					}
					
					currentIdx = 0;
					var freeref = asmapi.findFirstMethodCallAfter(method, MethodType.VIRTUAL, classNode.name, 
													targetMethodFree, targetMethodDesc, currentIdx);
													
					while (freeref != null) {
						var skipTarget = new LabelNode();
						var il = new InsnList();
            			il.add(new VarInsnNode(opcodes.ALOAD, 0));
						il.add(new InsnNode(opcodes.MONITOREXIT));
						il.add(new JumpInsnNode(opcodes.GOTO, skipTarget));
						instructions.insertBefore(freeref, il);
        				instructions.insert(freeref, skipTarget);
						currentIdx = instructions.indexOf(freeref)+1;
						freeref = asmapi.findFirstMethodCallAfter(method, MethodType.VIRTUAL, classNode.name, 
													targetMethodFree, targetMethodDesc, currentIdx);
					}
					

				}
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] PalettedContainerReLock Transformer Complete");
            	
            	return classNode;
            }
    	},
    	'ClassInheritanceMultiMapMap': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.util.ClassInstanceMultiMap',
                "methodName": "<init>",
        		"methodDesc": "(Ljava/lang/Class;)V"
            },
            "transformer": function(methodNode) {
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var MethodType = asmapi.MethodType;

				asmapi.log("INFO", "[JMTSUPERTRANS] ClassInheritanceMultiMapMap Transformer Called");
            	
            	var instructions = methodNode.instructions;
            	
            	//com/google/common/collect/Maps.newHashMap()Ljava/util/HashMap;
            	var callMethod = "newHashMap";
        		var callClass = "com/google/common/collect/Maps";
        		var callDesc = "()Ljava/util/HashMap;";
        		
        		var callTarget = asmapi.findFirstMethodCallAfter(methodNode, MethodType.STATIC, 
        				callClass, callMethod, callDesc, 0);
        		            	
            	var il = new InsnList();
            	// Purge old arrayList
            	il.add(new InsnNode(opcodes.POP));
            	/*
            	mv.visitTypeInsn(NEW, "java/util/concurrent/CopyOnWriteArrayList");
				mv.visitInsn(DUP);
				mv.visitMethodInsn(INVOKESPECIAL, "java/util/concurrent/CopyOnWriteArrayList", "<init>", "()V", false);
            	 */
            	il.add(new TypeInsnNode(opcodes.NEW, "java/util/concurrent/ConcurrentHashMap"));
            	il.add(new InsnNode(opcodes.DUP));
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"java/util/concurrent/ConcurrentHashMap", "<init>", "()V", false));
            	instructions.insert(callTarget, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] ClassInheritanceMultiMapMap Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'ClassInheritanceMultiMapGBC': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.util.ClassInstanceMultiMap'
            },
            "transformer": function(classNode) {
            	
            	
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var MethodType = asmapi.MethodType;
            	
				asmapi.log("INFO", "[JMTSUPERTRANS] ClassInheritanceMultiMapGBC Transformer Called");

            	var tgtdesc = "(Ljava/lang/Class;)Ljava/util/List;"
            	
        		var methods = classNode.methods;
            	
            	for (var i in methods) {
            		var method = methods[i];
            		
            		if (!method.desc.equals(tgtdesc)) {
            			continue;
            		}
            		
            		print("[JMTSUPERTRANS] Matched method " + method.name + " " + method.desc);
            		            		
            		var callMethod = "toList";
            		var callClass = "java/util/stream/Collectors";
            		var callDesc = "()Ljava/util/stream/Collector;";
            	
            		var callTarget = asmapi.findFirstMethodCallAfter(method, MethodType.STATIC, 
            				callClass, callMethod, callDesc, 0);
            		
            		if (callTarget == null) {
            			print("[JMTSUPERTRANS] MISSING TARGET INSN");
            			return;
            		}
            		
            		var tgtMethod = "toList";
            		var tgtClass = "org/jmt/mcmt/asmdest/ConcurrentCollections";
            		var tgtDesc = "()Ljava/util/stream/Collector;";
            		
            		callTarget.owner = tgtClass;
            		callTarget.name = tgtMethod;
            		callTarget.desc = tgtDesc;
            		
            		break;
            	
        		}
            		
            	asmapi.log("INFO", "[JMTSUPERTRANS] ClassInheritanceMultiMapGBC Transformer Complete");
            	
            	return classNode;
            }
    	},
    	'ServerWorldCollections': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.server.level.ServerLevel',
            },
            "transformer": function(classNode) {
				var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
				asmapi.log("INFO", "[JMTSUPERTRANS] ServerWorldCollections Transformer Called");            	


            	for (var i in classNode.methods) {
					
            		var methodNode = classNode.methods[i];

					if (!methodNode.name.equals("<init>")) {
            			continue;
            		}

					asmapi.log("INFO", "[JMTSUPERTRANS] ServerWorldCollections Transformer Ran");

            		toParallelHashSets(methodNode);
					toParallelDeque(methodNode);
				
				}
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] ServerWorldCollections Transformer Complete");
            	
            	return classNode;
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
		},
		'ServerWorldBlockPosFastUtkill': {
    		'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.server.level.ServerLevel'
            },
            "transformer": function(classNode) {
            	print("[JMTSUPERTRANS] ServerWorldBlockPosFastUtkill Transformer Called");
            	
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	var tgt = "it/unimi/dsi/fastutil/objects/ObjectLinkedOpenHashSet";
            	var replace = "java/util/Deque";
            	
            	var fields = classNode.fields;
            	
            	var tgtField = asmapi.mapField("f_8556_");
            	
            	for (var i in fields) {
            		var fieldNode = fields[i];
            		
            		if (fieldNode.name != tgtField) {
            			continue;
            		}
            		
            		fieldNode.signature = fieldNode.signature.replace(tgt, replace);
            		fieldNode.desc = fieldNode.desc.replace(tgt, replace);
            		print(fieldNode.name + "|" + fieldNode.desc + "|" + fieldNode.signature);
            	}
            	
            	var methods = classNode.methods;
            	
            	var targetMethods = {
        			"<init>": {
        				"desc": "(Lnet/minecraft/server/MinecraftServer;Ljava/util/concurrent/Executor;Lnet/minecraft/world/storage/SaveHandler;Lnet/minecraft/world/storage/WorldInfo;Lnet/minecraft/world/dimension/DimensionType;Lnet/minecraft/profiler/IProfiler;Lnet/minecraft/world/chunk/listener/IChunkStatusListener;)V",
        				"fallbackdesc": "(Lnet/minecraft/server/MinecraftServer;Ljava/util/concurrent/Executor;Lnet/minecraft/world/storage/SaveFormat$LevelSave;Lnet/minecraft/world/storage/IServerWorldInfo;Lnet/minecraft/util/RegistryKey;Lnet/minecraft/util/RegistryKey;Lnet/minecraft/world/DimensionType;Lnet/minecraft/world/chunk/listener/IChunkStatusListener;Lnet/minecraft/world/gen/ChunkGenerator;ZJLjava/util/List;Z)V",
        				"fallbackdesc2": "(Lnet/minecraft/server/MinecraftServer;Ljava/util/concurrent/Executor;Lnet/minecraft/world/storage/SaveFormat$LevelSave;Lnet/minecraft/world/storage/IServerWorldInfo;Lnet/minecraft/util/RegistryKey;Lnet/minecraft/world/DimensionType;Lnet/minecraft/world/chunk/listener/IChunkStatusListener;Lnet/minecraft/world/gen/ChunkGenerator;ZJLjava/util/List;Z)V",
        				"update": function(methodNode) {
        					var instructions = methodNode.instructions;
        					
        					var initTgt = asmapi.findFirstMethodCall(methodNode, MethodType.SPECIAL, tgt, "<init>", "()V");
        					//var newTgt = asmapi.findFirstInstructionBefore(methodNode, opcodes.NEW, instructions.indexOf(initTgt))
        					var putTgt = asmapi.findFirstInstructionAfter(methodNode, opcodes.PUTFIELD, instructions.indexOf(initTgt))
        					
        					var newTgt = initTgt;
        					
        					while (newTgt.getOpcode() != opcodes.NEW) {
        						newTgt = newTgt.getPrevious();
        					}
        					
        					if (initTgt == null || newTgt == null || putTgt == null) {
        						print("[JMTSUPERTRANS] MISSING TARGET INSN - INIT");
        						return false;
        					}
        					
        					newTgt.desc = "java/util/concurrent/ConcurrentLinkedDeque";
        					initTgt.owner = "java/util/concurrent/ConcurrentLinkedDeque";
    						putTgt.desc = putTgt.desc.replace(tgt, replace);
    						
        					/*
    						var printTgt = newTgt.getPrevious().getPrevious();
    						for (var i = 0; i < 30; i++) {
    							printInsnNode(printTgt);
    							printTgt = printTgt.getNext();
    						}
    						*/
    						
    						return true;
        				}
        			},
            	}
            	
            	targetMethods[asmapi.mapMethod("m_7696_")] = {
            			"desc": "(Lnet/minecraft/core/BlockPos;Lnet/minecraft/world/level/block/Block;II)V",
            			"update": function(methodNode) {
            				
            				var getTgt = asmapi.findFirstInstructionAfter(methodNode, opcodes.GETFIELD, 0)
            				var addTgt = asmapi.findFirstMethodCall(methodNode, MethodType.VIRTUAL, tgt, "add", "(Ljava/lang/Object;)Z");
            				
            				if (addTgt == null || getTgt == null) {
        						print("[JMTSUPERTRANS] MISSING TARGET INSN - addBlockEvent");
        						return false;
        					}
            				
            				getTgt.desc = getTgt.desc.replace(tgt, replace);
            				addTgt.owner = replace;
            				addTgt.setOpcode(opcodes.INVOKEINTERFACE);
            				addTgt.itf = true;
            				
            				return true;
            			}
            	}
            	
            	targetMethods[asmapi.mapMethod("m_8722_")] = {
            			"desc": "(Lnet/minecraft/world/level/levelgen/structure/BoundingBox;)V",
            			"update": function(methodNode) {
            				
            				var getTgt = asmapi.findFirstInstructionAfter(methodNode, opcodes.GETFIELD, 0)
            				var addTgt = asmapi.findFirstMethodCall(methodNode, MethodType.VIRTUAL, tgt, "removeIf", "(Ljava/util/function/Predicate;)Z");
            				
            				if (addTgt == null || getTgt == null) {
        						print("[JMTSUPERTRANS] MISSING TARGET INSN - addBlockEvent");
        						return false;
        					}
            				
            				getTgt.desc = getTgt.desc.replace(tgt, replace);
            				addTgt.owner = replace;
            				addTgt.setOpcode(opcodes.INVOKEINTERFACE);
            				addTgt.itf = true;
            				
            				return true;
            			}
            	}
            	
            	targetMethods[asmapi.mapMethod("m_8807_")] = {
            			"desc": "()V",
            			"update": function(methodNode) {
            				var instructions = methodNode.instructions;
            				
            				var getTgt = asmapi.findFirstInstructionAfter(methodNode, opcodes.GETFIELD, 0)
            				
            				var call = asmapi.buildMethodCall("org/jmt/mcmt/asmdest/ASMHookTerminator", 
            						"sendQueuedBlockEvents", "(Ljava/util/Deque;Lnet/minecraft/server/level/ServerLevel;)V",  MethodType.STATIC)
            						
            				if (getTgt == null) {
        						print("[JMTSUPERTRANS] MISSING TARGET INSN - addBlockEvent");
        						return false;
        					}
            				
            				getTgt.desc = getTgt.desc.replace(tgt, replace);
            						
            				var il = new InsnList();
            				il.add(new VarInsnNode(opcodes.ALOAD, 0));
            				il.add(call);
            				il.add(new InsnNode(opcodes.RETURN));
            				
            				instructions.insert(getTgt, il);
            				
            				return true;
            			}
            	}
            	
            	for (var i in methods) {
            		var methodNode = methods[i];
            		
            		var op = targetMethods[methodNode.name];
            		if (op != undefined && (op.desc == methodNode.desc 
            				|| op.fallbackdesc == methodNode.desc || op.fallbackdesc2 == methodNode.desc)) {
            			if (op.fallbackdesc == methodNode.desc || op.fallbackdesc2 == methodNode.desc) {
            				print("[JMTSUPERTRANS] 1.16 WARNING")
            			}
            			print("[JMTSUPERTRANS] updating method: " + methodNode.name + methodNode.desc)
            			var result = op.update(methodNode)
            			op.result = result;
            		}
            	}
            	
            	for (var o in targetMethods) {
            		if (targetMethods[o].result != true) {
            			print("[JMTSUPERTRANS] failed to update method: " + o + targetMethods[o].desc)
            		}
            	}
            	
            	
            	
            	return classNode;
            }
    	},
		'ServerTickListGetPending': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.lighting.DynamicGraphMinFixedPoint',
                "methodName": "m_75588_",
        		"methodDesc": "(I)I"
            },
            "transformer": synchronizeMethod("DynamicGraphMinFixedPointRunUpdates")
    	},
		'EntityTickList': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.world.level.entity.EntityTickList',
            },
            "transformer": synchronizeClass("EntityTickList")
    	},
    	'ServerWorldOnBlockStateChange': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.server.level.ServerLevel',
                "methodName": "m_6559_ ",
        		"methodDesc": "(Lnet/minecraft/core/BlockPos;Lnet/minecraft/world/level/block/BlockState;Lnet/minecraft/world/level/block/BlockState;)V"
            },
            "transformer": synchronizeMethod("ServerWorldOnBlockStateChange")
    	},
		'TemplateManagerHashMap': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplateManager',
            },
            "transformer": function(classNode) {
				var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	asmapi.log("INFO", "[JMTSUPERTRANS] TemplateManagerHashMap Transformer Called");
            	
				for (var i in classNode.methods) {
					
            		var methodNode = classNode.methods[i];

					if (!methodNode.name.equals("<init>")) {
            			continue;
            		}

					asmapi.log("INFO", "[JMTSUPERTRANS] TemplateManagerHashMap Transformer Ran");
					
					toParallelHashMaps(methodNode);
            		toParallelHashSets(methodNode);
					toParallelDeque(methodNode);
				
				}
            	
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] TemplateManagerHashMap Transformer Complete");
            	
            	return classNode;
            }
    	},
    	'serverChunkProviderTick': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.server.level.ServerChunkCache',
                "methodName": "m_201698_",
        		"methodDesc": "(Ljava/util/function/BooleanSupplier;Z)V"
            },
            "transformer": synchronizeMethod("SCPTick")
    	},
    	'WorldGetTE': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.Level',
                "methodName": "m_7702_",
        		"methodDesc": "(Lnet/minecraft/core/BlockPos;)Lnet/minecraft/world/level/block/entity/BlockEntity;"
            },
            "transformer": function(methodNode) {
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] WorldGetTE Transformer Called");
            	
            	
            	var instructions = methodNode.instructions;
            	
            	//methodNode.access += opcodes.ACC_SYNCHRONIZED;
            	
            	var target = asmapi.findFirstInstruction(methodNode, opcodes.GETFIELD);
            	if (target == null) {
            		asmapi.log("FATAL", "[JMTSUPERTRANS] WorldGetTE Transformer FAILED; this may be craftbukkit's doing");
            		asmapi.log("FATAL", "If you are not running CB or equiv, please start panicing");
            		return methodNode;
            	}
            	var target = asmapi.findFirstInstructionAfter(methodNode, opcodes.GETFIELD, instructions.indexOf(target)+1);
            	
            	var il = new InsnList();
            	il.add(new InsnNode(opcodes.POP));
            	il.add(new InsnNode(opcodes.DUP));
            	instructions.insert(target, il);
            	
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] WorldGetTE Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'classInheritanceMultiMapList': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.util.ClassInstanceMultiMap',
                "methodName": "<init>",
        		"methodDesc": "(Ljava/lang/Class;)V"
            },
            "transformer": function(methodNode) {
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var MethodType = asmapi.MethodType;

				asmapi.log("INFO", "[JMTSUPERTRANS] MultiMapList Transformer Called");
            	
            	var instructions = methodNode.instructions;
            	            	
            	var callMethod = "newArrayList";
        		var callClass = "com/google/common/collect/Lists";
        		var callDesc = "()Ljava/util/ArrayList;";
        		
        		var callTarget = asmapi.findFirstMethodCallAfter(methodNode, MethodType.STATIC, 
        				callClass, callMethod, callDesc, 0);
        		            	
            	var il = new InsnList();
            	// Purge old arrayList
            	il.add(new InsnNode(opcodes.POP));
            	/*
            	mv.visitTypeInsn(NEW, "java/util/concurrent/CopyOnWriteArrayList");
				mv.visitInsn(DUP);
				mv.visitMethodInsn(INVOKESPECIAL, "java/util/concurrent/CopyOnWriteArrayList", "<init>", "()V", false);
            	 */
            	il.add(new TypeInsnNode(opcodes.NEW, "java/util/concurrent/CopyOnWriteArrayList"));
            	il.add(new InsnNode(opcodes.DUP));
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"java/util/concurrent/CopyOnWriteArrayList", "<init>", "()V", false));
            	instructions.insert(callTarget, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] MultiMapList Transformer Complete");
            	
            	return methodNode;
            }
    	},
	}
}