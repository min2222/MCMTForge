function initializeCoreMod() {
    return {
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
            	
            	var instructions = methodNode.instructions;

				asmapi.log("INFO", "[JMTSUPERTRANS] MultiMapList Transformer Called");
            	            	
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
            	
            	var instructions = methodNode.instructions;

				asmapi.log("INFO", "[JMTSUPERTRANS] ClassInheritanceMultiMapMap Transformer Called");
            	
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
            	
            	print("[JMTSUPERTRANS] ClassInheritanceMultiMapMap Transformer Complete");
            	
            	return methodNode;
            }
    	},
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
    }
}