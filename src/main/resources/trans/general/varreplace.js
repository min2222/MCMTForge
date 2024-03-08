function printInsnNode(printTgt) {
	print(printTgt+"|"+printTgt.opcode
			+"|"+printTgt.desc+"|"+printTgt.owner+"|"+printTgt.name+"|"+printTgt["var"])
}

function getFieldAccessAfter(methodNode, opcode, owner, name, descriptor, after) {
	var FieldInsnNode = Java.type("org.objectweb.asm.tree.FieldInsnNode");
	var node = methodNode.instructions.get(after);
	while (node != null) {
		if (node instanceof FieldInsnNode) {
			if (node.getOpcode() == opcode &&
				node.name.equals(name) && 
				node.desc.equals(descriptor) &&
				node.owner.equals(owner)) {
				return node
			}
		}
		node = node.getNext();
	}
	return null;
	
}

function synchronizeOn(methodNode, before, loadInsns) {
	var opcodes = Java.type('org.objectweb.asm.Opcodes');
	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
	
	var instructions = methodNode.instructions;
	
	var startInsn = instructions.get(before);
	
	var il = new InsnList();
	for (var insn in loadInsns) {
		il.add(loadInsns[insn].clone(null));
	}
	il.add(new InsnNode(opcodes.MONITORENTER));
	
	instructions.insertBefore(startInsn, il);
	
	var tgtInsn = startInsn.getNext();
	while (tgtInsn != null) {
		if (tgtInsn.getOpcode() == opcodes.IRETURN ||
				tgtInsn.getOpcode() == opcodes.LRETURN ||
				tgtInsn.getOpcode() == opcodes.FRETURN ||
				tgtInsn.getOpcode() == opcodes.DRETURN ||
				tgtInsn.getOpcode() == opcodes.ARETURN ||
				tgtInsn.getOpcode() == opcodes.RETURN) {
			il = new InsnList();
			for (var insn in loadInsns) {
				il.add(loadInsns[insn].clone(null));
			}
			il.add(new InsnNode(opcodes.MONITOREXIT));
			instructions.insert(tgtInsn, il);
		}
		tgtInsn = tgtInsn.getNext();
	}
	
}

function synchronizeMethod(methodNode, debugLine) {
	print("[JMTSUPERTRANS] " + debugLine + " Transformer Called");
	
	var opcodes = Java.type('org.objectweb.asm.Opcodes');
	
	methodNode.access += opcodes.ACC_SYNCHRONIZED;
	
	print("[JMTSUPERTRANS] " + debugLine + " Transformer Complete");
	
	return methodNode;
}

function initializeCoreMod() {
    return {
    	'LevelBasedGraph-UpdatesByLevel': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.lighting.DynamicGraphMinFixedPoint',
                "methodName": "<init>",
        		"methodDesc": "(III)V"
            },
            "transformer": function(methodNode) {
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var FieldNode = Java.type("org.objectweb.asm.tree.FieldNode");
            	var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] LevelBasedGraph-UpdatesByLevel Transformer Called");
            	
            	var initTgt = asmapi.findFirstMethodCall(methodNode, MethodType.SPECIAL, 
            			"net/minecraft/world/level/lighting/DynamicGraphMinFixedPoint$1", "<init>", "(Lnet/minecraft/world/level/lighting/DynamicGraphMinFixedPoint;IFI)V");
            	
            	var il = new InsnList();
            	il.add(new InsnNode(opcodes.POP))
            	//Using sync instead of concurrent as should be mostly single threaded; and should be faster
            	il.add(new TypeInsnNode(opcodes.NEW, "org/jmt/mcmt/paralelised/fastutil/sync/SyncLongLinkedOpenHashSet"))
            	il.add(new InsnNode(opcodes.DUP))
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"org/jmt/mcmt/paralelised/fastutil/sync/SyncLongLinkedOpenHashSet", "<init>",
            			"()V"))
            			
            	var instructions = methodNode.instructions;
            	
            	instructions.insert(initTgt, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] LevelBasedGraph-UpdatesByLevel Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'LevelBasedGraph-propagationLevels': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.lighting.DynamicGraphMinFixedPoint',
                "methodName": "<init>",
        		"methodDesc": "(III)V"
            },
            "transformer": function(methodNode) {
	
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var FieldNode = Java.type("org.objectweb.asm.tree.FieldNode");
            	var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] LevelBasedGraph-propagationLevels Transformer Called");
            	
            	var initTgt = asmapi.findFirstMethodCall(methodNode, MethodType.SPECIAL, 
            			"net/minecraft/world/level/lighting/DynamicGraphMinFixedPoint$2", "<init>", "(Lnet/minecraft/world/level/lighting/DynamicGraphMinFixedPoint;IFI)V");
            	
            	var il = new InsnList();
            	il.add(new InsnNode(opcodes.POP))
            	il.add(new TypeInsnNode(opcodes.NEW, "org/jmt/mcmt/paralelised/fastutil/Long2ByteConcurrentHashMap"))
            	il.add(new InsnNode(opcodes.DUP))
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"org/jmt/mcmt/paralelised/fastutil/Long2ByteConcurrentHashMap", "<init>",
            			"()V"))
            			
            	var instructions = methodNode.instructions;
            	
            	instructions.insert(initTgt, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] LevelBasedGraph-propagationLevels Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'RegionSectionCache-data': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.chunk.storage.SectionStorage',
                "methodName": "<init>",
        		"methodDesc": "(Ljava/nio/file/Path;Ljava/util/function/Function;Ljava/util/function/Function;Lcom/mojang/datafixers/DataFixer;Lnet/minecraft/util/datafix/DataFixTypes;ZLnet/minecraft/core/RegistryAccess;Lnet/minecraft/world/level/LevelHeightAccessor;)V"
            },
            "transformer": function(methodNode) {
	
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var FieldNode = Java.type("org.objectweb.asm.tree.FieldNode");
            	var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] RegionSectionCache-data Transformer Called");
            	
            	var initTgt = asmapi.findFirstMethodCall(methodNode, MethodType.SPECIAL, 
            			"it/unimi/dsi/fastutil/longs/Long2ObjectOpenHashMap", "<init>", "()V");
            	
            	var il = new InsnList();
            	il.add(new InsnNode(opcodes.POP))
            	il.add(new TypeInsnNode(opcodes.NEW, "org/jmt/mcmt/paralelised/fastutil/Long2ObjectConcurrentHashMap"))
            	il.add(new InsnNode(opcodes.DUP))
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"org/jmt/mcmt/paralelised/fastutil/Long2ObjectConcurrentHashMap", "<init>",
            			"()V"))
            			
            	var instructions = methodNode.instructions;
            	
            	instructions.insert(initTgt, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] RegionSectionCache-data Transformer Complete");
            	
            	return methodNode;
            }
    	},
    	'RegionSectionCache-dirtySections': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.world.level.chunk.storage.SectionStorage',
                "methodName": "<init>",
        		"methodDesc": "(Ljava/nio/file/Path;Ljava/util/function/Function;Ljava/util/function/Function;Lcom/mojang/datafixers/DataFixer;Lnet/minecraft/util/datafix/DataFixTypes;ZLnet/minecraft/core/RegistryAccess;Lnet/minecraft/world/level/LevelHeightAccessor;)V"
            },
            "transformer": function(methodNode) {
	
            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var VarInsnNode = Java.type("org.objectweb.asm.tree.VarInsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var FieldNode = Java.type("org.objectweb.asm.tree.FieldNode");
            	var LabelNode = Java.type("org.objectweb.asm.tree.LabelNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] RegionSectionCache-dirtySections Transformer Called");
            	
            	var initTgt = asmapi.findFirstMethodCall(methodNode, MethodType.SPECIAL, 
            			"it/unimi/dsi/fastutil/longs/LongLinkedOpenHashSet", "<init>", "()V");
            	
            	var il = new InsnList();
            	il.add(new InsnNode(opcodes.POP))
            	il.add(new TypeInsnNode(opcodes.NEW, "org/jmt/mcmt/paralelised/fastutil/ConcurrentLongLinkedOpenHashSet"))
            	il.add(new InsnNode(opcodes.DUP))
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"org/jmt/mcmt/paralelised/fastutil/ConcurrentLongLinkedOpenHashSet", "<init>",
            			"()V"))
            			
            	var instructions = methodNode.instructions;
            	
            	instructions.insert(initTgt, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] RegionSectionCache-dirtySections Transformer Complete");
            	
            	return methodNode;
            }
    	},
		'TicketManagerTickets': {
            'target': {
                'type': 'METHOD',
                'class': 'net.minecraft.server.level.DistanceManager',
                "methodName": "<init>",
        		"methodDesc": "(Ljava/util/concurrent/Executor;Ljava/util/concurrent/Executor;)V"
            },
            "transformer": function(methodNode) {

            	var opcodes = Java.type('org.objectweb.asm.Opcodes');
            	var asmapi = Java.type('net.minecraftforge.coremod.api.ASMAPI');
            	var InsnList = Java.type("org.objectweb.asm.tree.InsnList");
            	var InsnNode = Java.type("org.objectweb.asm.tree.InsnNode");
            	var MethodInsnNode = Java.type("org.objectweb.asm.tree.MethodInsnNode");
            	var TypeInsnNode = Java.type("org.objectweb.asm.tree.TypeInsnNode");
            	var MethodType = asmapi.MethodType;
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] TicketManagerTickets Transformer Called");
            	
            	var initTgt = asmapi.findFirstMethodCall(methodNode, MethodType.SPECIAL, 
            			"it/unimi/dsi/fastutil/longs/Long2ObjectOpenHashMap", "<init>", "()V");
            	
            	var il = new InsnList();
            	il.add(new InsnNode(opcodes.POP))
            	il.add(new TypeInsnNode(opcodes.NEW, "org/jmt/mcmt/paralelised/fastutil/Long2ObjectOpenConcurrentHashMap"))
            	il.add(new InsnNode(opcodes.DUP))
            	il.add(new MethodInsnNode(opcodes.INVOKESPECIAL, 
            			"org/jmt/mcmt/paralelised/fastutil/Long2ObjectOpenConcurrentHashMap", "<init>",
            			"()V"))
            			
            	var instructions = methodNode.instructions;
            	
            	instructions.insert(initTgt, il);
            	
            	asmapi.log("INFO", "[JMTSUPERTRANS] TicketManagerTickets Transformer Complete");
            	
            	return methodNode;
            }
    	},
    }
}