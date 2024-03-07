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

            	il.add(new TypeInsnNode(opcodes.NEW, "java/util/concurrent/CopyOnWriteArrayList"));
            	il.add(new InsnNode(opcodes.DUP));
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"java/util/concurrent/CopyOnWriteArrayList", "<init>", "()V", false));
            	instructions.insert(callTarget, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] MultiMapList Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'ServerExecutionThread': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.server.MinecraftServer'
            },
            "transformer": function(classNode) {
				var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
				var List = Java.type("java.util.ArrayList");
				var LocalVariableNode  = Java.type("org.objectweb.asm.tree.LocalVariableNode");
            	var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
				var InsnList = Java.type("org.objectweb.asm.tree.InsnList");

            	asmapi.log("INFO", "[JMTSUPERTRANS] ServerExecutionThread Transformer Called");
            	
            	var methods = classNode.methods;

				var targetNode = asmapi.getMethodNode();
				targetNode.name = asmapi.mapMethod("m_18695_");
				targetNode.desc = "()Z";
				targetNode.access = 0x1;
				
				var fn_start = new LabelNode();
				var fn_end = new LabelNode();
				
				targetNode.localVariables = new List();
				targetNode.localVariables.add(new LocalVariableNode(
					"this", "Lnet/minecraft/server/MinecraftServer;", null,
					fn_start, fn_end, 0
				));
				
				instructions = targetNode.instructions;
				instructions.add(fn_start)
				instructions.add(new VarInsnNode(opcodes.ALOAD, 0));
				instructions.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
					"net/minecraft/util/thread/ReentrantBlockableEventLoop", 
					targetNode.name, "()Z", false
				));
				instructions.add(new InsnNode(opcodes.IRETURN));
				instructions.add(fn_end);

				var hit = false;
				for (var i in methods) {
            		var mn = methods[i];
					asmapi.log("DEBUG", "[JMTSUPERTRANS] Saw method " + mn.name + " " + mn.desc);
					if (mn.name == targetNode.name && mn.desc == targetNode.desc) {
						hit = true;
						targetNode = mn;
						break;
					}
				}
				
				if (!hit) {
					methods.add(targetNode);
					asmapi.log("INFO", "[JMTSUPERTRANS] Not seen adding method");
				}
				
				instructions = targetNode.instructions;
				
				var il = new InsnList();
				il.add(new VarInsnNode(opcodes.ALOAD, 0));
				il.add(new MethodInsnNode(opcodes.INVOKESTATIC, 
            				"org/jmt/mcmt/asmdest/ASMHookTerminator", "serverExecutionThreadPatch",
            				"(Lnet/minecraft/server/MinecraftServer;)Z" ,false))
				il.add(new InsnNode(opcodes.IOR));
				
				insn = targetNode.instructions.getFirst();
				
				while (insn != null) {
					if (insn.opcode == opcodes.IRETURN) {
						targetNode.instructions.insertBefore(insn, il);
						il = new InsnList();
						il.add(new VarInsnNode(opcodes.ALOAD, 0));
						il.add(new MethodInsnNode(opcodes.INVOKESTATIC, 
		            				"org/jmt/mcmt/asmdest/ASMHookTerminator", "serverExecutionThreadPatch",
		            				"(Lnet/minecraft/server/MinecraftServer;)Z" ,false))
						il.add(new InsnNode(opcodes.IOR));
					}
					insn = insn.getNext();
				}
				            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] ServerExecutionThread Transformer Complete");
            	
                return classNode;
			}
    	},
    	'mcserver': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.server.MinecraftServer'
                	
            },
            'transformer': function(classNode) {
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var JumpInsnNode = Java.type("org.objectweb.asm.tree.JumpInsnNode");
            	var LdcInsnNode = Java.type("org.objectweb.asm.tree.LdcInsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] World Transformer Called");

            	var methods = classNode.methods;
            	
            	var targetMethodName = asmapi.mapMethod("m_5703_"); 
            	var targetMethodDesc = "(Ljava/util/function/BooleanSupplier;)V";
            	
            	for (var i in methods) {
            		var method = methods[i];
            		
            		if (!method.name.equals(targetMethodName)) {
            			continue;
            		} else if (!method.desc.equals(targetMethodDesc)) {
            			continue;
            		}
            		asmapi.log("DEBUG", "[JMTSUPERTRANS]Matched method " + method.name + " " + method.desc);
            		
            		var instructions = method.instructions;
            		
            		var preTarget = null;
            		var postTarget = null;
            		
            		var arrayLength = instructions.size();
            		for (var i = 0; i < arrayLength; ++i) {
            			var instruction = instructions.get(i);
            			if (instruction instanceof LdcInsnNode) {
            				if (instruction.cst.equals("levels")) {
            					// We have 1 before our pre-insertion point
            					preTarget = instruction;
            					preTarget = preTarget.getNext();
            				} else if (instruction.cst.equals("dim_unloading")) {
            					// we are 3 after our insertion point
            					postTarget = instruction;
            					postTarget = postTarget.getPrevious();
            					postTarget = postTarget.getPrevious();
            					postTarget = postTarget.getPrevious();
            				} else if (instruction.cst.equals("connection") && postTarget == null) {
            					asmapi.log("INFO", "YOU ARE USING 1.16 - Says coremods (if this is wrong something borked)")
            					postTarget = instruction;
            					postTarget = postTarget.getPrevious();
            					postTarget = postTarget.getPrevious();
            					//postTarget = postTarget.getPrevious();
            				}
            			}
            		}

            		
            		var callMethod = asmapi.mapMethod("m_8793_");
            		var callClass = "net/minecraft/server/level/ServerLevel";
            		
            		var callTarget = asmapi.findFirstMethodCallAfter(method, MethodType.VIRTUAL, 
            				callClass, callMethod, "(Ljava/util/function/BooleanSupplier;)V", 0);
            		
            		
            		if (callTarget != null && preTarget != null && postTarget != null) {
            			asmapi.log("INFO", "[JMTSUPERTRANS] FOUND TARGET INSNS");
            		} else {
            			asmapi.log("ERROR", "[JMTSUPERTRANS] MISSING TARGET INSNS:");
            			asmapi.log("ERROR", "[JMTSUPERTRANS] HAVE PRE:" + (preTarget != null));
            			asmapi.log("ERROR", "[JMTSUPERTRANS] HAVE POST:" + (postTarget != null));
            			asmapi.log("ERROR", "[JMTSUPERTRANS] HAVE CALL:" + (callTarget != null));
            			return classNode;
            		}
            		
            		//Call Hook
            		
            		var il = new InsnList();
            		
            		// FORGE BUS HACKS
            		
					//net.minecraftforge.fmllegacy.hooks.BasicEventHooks.onPostWorldTick(serverlevel);
            		var skipTarget2 = new LabelNode();
            		var toSkip = asmapi.findFirstMethodCallAfter(method, MethodType.STATIC, 
            				"net/minecraftforge/event/ForgeEventFactory", "onPostLevelTick", "(Lnet/minecraft/world/level/Level;)V", 0);
            		var skipPop = 1;
            		if (toSkip == null) {
						asmapi.log("INFO", "[JMTSUPERTRANS] World Transformer Sees 1.18.2!!!");
						toSkip = asmapi.findFirstMethodCallAfter(method, MethodType.STATIC, 
            				"net/minecraftforge/event/ForgeEventFactory", "onPostLevelTick", "(Lnet/minecraft/world/level/Level;Ljava/util/function/BooleanSupplier;)V", 0);
        				skipPop = 2;
					}
            		
            		il = new InsnList();
            		while (skipPop-- > 0) {
            			il.add(new InsnNode(opcodes.POP));
            		}
            		il.add(new JumpInsnNode(opcodes.GOTO, skipTarget2));
            		instructions.insertBefore(toSkip, il);
            		instructions.insert(toSkip, skipTarget2);
            		
            		// Break because this particular coremod only targets one method
            		break;
            	}
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] World Transformer Complete");
            	
                return classNode;
            }
        },
	}
}