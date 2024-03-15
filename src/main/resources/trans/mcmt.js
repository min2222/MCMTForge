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
    	'ServerTickListGetPending': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.lighting.DynamicGraphMinFixedPoint',
                "methodName": "m_75588_",
        		"methodDesc": "(I)I"
            },
            "transformer": synchronizeMethod("DynamicGraphMinFixedPointRunUpdates")
    	},
		'Raid': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.world.level.entity.Raid',
            },
            "transformer": synchronizeClass("Raid")
    	},
    	'WalkNodeEvaluator': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.world.level.pathfinder.WalkNodeEvaluator',
            },
            "transformer": synchronizeClass("WalkNodeEvaluator")
    	},
    	'CollectingNeighborUpdater': {
            'target': {
                'type': 'CLASS',
                'name': 'net.minecraft.world.level.redstone.CollectingNeighborUpdater',
            },
            "transformer": synchronizeClass("CollectingNeighborUpdater")
    	},
	}
}