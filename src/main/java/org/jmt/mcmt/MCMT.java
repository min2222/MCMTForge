package org.jmt.mcmt;

import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.jmt.mcmt.asmdest.ASMHookTerminator;
import org.jmt.mcmt.commands.ConfigCommand;
import org.jmt.mcmt.commands.StatsCommand;
import org.jmt.mcmt.config.GeneralConfig;
import org.jmt.mcmt.jmx.JMXRegistration;
import org.jmt.mcmt.serdes.SerDesRegistry;

import com.mojang.brigadier.CommandDispatcher;

import net.minecraft.commands.CommandSourceStack;
import net.minecraftforge.common.MinecraftForge;
/* 1.16.1 code; AKA the only thing that changed  */
import net.minecraftforge.event.RegisterCommandsEvent;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.ModLoadingContext;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.fml.event.lifecycle.InterModEnqueueEvent;
import net.minecraftforge.fml.event.lifecycle.InterModProcessEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

// The value here should match an entry in the META-INF/mods.toml file
@Mod("jmt_mcmt")
public class MCMT
{
    // Directly reference a log4j logger.
    public static final Logger LOGGER = LogManager.getLogger();

    public MCMT() {
        // Register the setup method for modloading
        FMLJavaModLoadingContext.get().getModEventBus().addListener(this::setup);
        // Register the enqueueIMC method for modloading
        FMLJavaModLoadingContext.get().getModEventBus().addListener(this::enqueueIMC);
        // Register the processIMC method for modloading
        FMLJavaModLoadingContext.get().getModEventBus().addListener(this::processIMC);
        // Register the doClientStuff method for modloading
        //FMLJavaModLoadingContext.get().getModEventBus().addListener(this::doClientStuff);

        // Register ourselves for server and other game events we are interested in
        MinecraftForge.EVENT_BUS.register(this);
        
        if (System.getProperty("jmt.mcmt.jmx") != null) {
            JMXRegistration.register();
        }
        
        StatsCommand.runDataThread();
        SerDesRegistry.init();
        
        ModLoadingContext.get().registerConfig(net.minecraftforge.fml.config.ModConfig.Type.COMMON, GeneralConfig.GENERAL_SPEC);
    }

    private void setup(final FMLCommonSetupEvent event)
    {

    }

    private void enqueueIMC(final InterModEnqueueEvent event)
    {
    	
    }

    private void processIMC(final InterModProcessEvent event)
    {
        LOGGER.info("Got IMC {}", event.getIMCStream().
                map(m->m.messageSupplier().get()).
                collect(Collectors.toList()));
    }
    
    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
        // do something when the server starts
        LOGGER.info("MCMT Initialising Server...");
        CommandDispatcher<CommandSourceStack> commandDispatcher = event.getServer().getCommands().getDispatcher();
        ConfigCommand.register(commandDispatcher);
        StatsCommand.resetAll();
        LOGGER.info("MCMT Setting up threadpool...");
        ASMHookTerminator.setupThreadPool(GeneralConfig.getParallelism());
    }
    
    @SubscribeEvent
    public void onRegisterCommands(RegisterCommandsEvent event) {
    	LOGGER.info("MCMT Registering Commands");
    	CommandDispatcher<CommandSourceStack> commandDispatcher = event.getDispatcher();
        ConfigCommand.register(commandDispatcher);
    }
}
