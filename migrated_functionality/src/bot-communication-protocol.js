/**
 * Bot Communication Protocol
 * Enables inter-bot messaging and coordination within the IZA OS ecosystem
 */

class BotCommunicationProtocol {
  constructor() {
    this.protocolVersion = '1.0.0';
    this.messageTypes = {
      REQUEST: 'request',
      RESPONSE: 'response',
      NOTIFICATION: 'notification',
      BROADCAST: 'broadcast',
      HEARTBEAT: 'heartbeat',
      ERROR: 'error'
    };
    
    this.messagePriorities = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };
    
    this.registeredBots = new Map();
    this.messageQueue = [];
    this.messageHistory = [];
    this.subscriptions = new Map();
    
    this.initializeProtocol();
  }

  /**
   * Initialize the communication protocol
   */
  initializeProtocol() {
    console.log('🤖 Bot Communication Protocol initialized');
    
    // Setup message routing
    this.setupMessageRouting();
    
    // Setup heartbeat monitoring
    this.setupHeartbeatMonitoring();
    
    // Setup error handling
    this.setupErrorHandling();
    
    // Setup message persistence
    this.setupMessagePersistence();
    
    // Register default bots
    this.registerDefaultBots();
  }

  /**
   * Setup message routing
   */
  setupMessageRouting() {
    // Listen for custom bot communication events
    window.addEventListener('bot-message', (event) => {
      this.handleIncomingMessage(event.detail);
    });
    
    // Setup message processing
    setInterval(() => {
      this.processMessageQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Setup heartbeat monitoring
   */
  setupHeartbeatMonitoring() {
    setInterval(() => {
      this.sendHeartbeat();
      this.checkBotHealth();
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      this.handleProtocolError(event.reason);
    });
    
    window.addEventListener('error', (event) => {
      this.handleProtocolError(event.error);
    });
  }

  /**
   * Setup message persistence
   */
  setupMessagePersistence() {
    // Load message history from localStorage
    const savedHistory = localStorage.getItem('bot-message-history');
    if (savedHistory) {
      try {
        this.messageHistory = JSON.parse(savedHistory);
      } catch (error) {
        console.warn('Failed to load message history:', error);
      }
    }
    
    // Save message history periodically
    setInterval(() => {
      this.saveMessageHistory();
    }, 60000); // Every minute
  }

  /**
   * Register default bots
   */
  registerDefaultBots() {
    // Register bots as they become available
    const botTypes = [
      'searchIntelligenceBot',
      'dashboardMonitoringBot',
      'nlpProcessingBot',
      'contentDiscoveryBot',
      'securityComplianceBot'
    ];
    
    botTypes.forEach(botType => {
      if (window[botType]) {
        this.registerBot(botType, window[botType]);
      }
    });
  }

  /**
   * Register a bot with the protocol
   */
  registerBot(botId, botInstance) {
    const botInfo = {
      id: botId,
      instance: botInstance,
      capabilities: this.extractBotCapabilities(botInstance),
      status: 'active',
      lastHeartbeat: Date.now(),
      messageCount: 0,
      errorCount: 0
    };
    
    this.registeredBots.set(botId, botInfo);
    
    console.log(`🤖 Bot registered: ${botId}`, botInfo.capabilities);
    
    // Notify other bots
    this.broadcastMessage({
      type: this.messageTypes.NOTIFICATION,
      from: 'protocol',
      to: 'all',
      data: {
        event: 'bot_registered',
        botId: botId,
        capabilities: botInfo.capabilities
      }
    });
  }

  /**
   * Extract bot capabilities
   */
  extractBotCapabilities(botInstance) {
    const capabilities = [];
    
    if (botInstance.searchCapabilities) capabilities.push('search');
    if (botInstance.monitoringCapabilities) capabilities.push('monitoring');
    if (botInstance.nlpCapabilities) capabilities.push('nlp');
    if (botInstance.discoveryCapabilities) capabilities.push('discovery');
    if (botInstance.securityCapabilities) capabilities.push('security');
    
    return capabilities;
  }

  /**
   * Send a message between bots
   */
  sendMessage(message) {
    const fullMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      protocolVersion: this.protocolVersion,
      priority: message.priority || this.messagePriorities.MEDIUM,
      ...message
    };
    
    // Validate message
    if (!this.validateMessage(fullMessage)) {
      throw new Error('Invalid message format');
    }
    
    // Add to queue
    this.messageQueue.push(fullMessage);
    
    // Add to history
    this.messageHistory.push(fullMessage);
    
    // Keep history size manageable
    if (this.messageHistory.length > 1000) {
      this.messageHistory.shift();
    }
    
    console.log(`📨 Message sent: ${fullMessage.type} from ${fullMessage.from} to ${fullMessage.to}`);
    
    return fullMessage.id;
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate message format
   */
  validateMessage(message) {
    return message.type && 
           message.from && 
           message.to && 
           Object.values(this.messageTypes).includes(message.type);
  }

  /**
   * Process message queue
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.routeMessage(message);
    }
  }

  /**
   * Route message to appropriate bot
   */
  routeMessage(message) {
    try {
      if (message.to === 'all') {
        this.broadcastMessage(message);
      } else if (message.to === 'protocol') {
        this.handleProtocolMessage(message);
      } else {
        this.deliverMessage(message);
      }
    } catch (error) {
      this.handleMessageError(message, error);
    }
  }

  /**
   * Broadcast message to all bots
   */
  broadcastMessage(message) {
    this.registeredBots.forEach((botInfo, botId) => {
      if (botId !== message.from && botInfo.status === 'active') {
        this.deliverMessageToBot(botId, message);
      }
    });
  }

  /**
   * Deliver message to specific bot
   */
  deliverMessage(message) {
    const botInfo = this.registeredBots.get(message.to);
    if (botInfo && botInfo.status === 'active') {
      this.deliverMessageToBot(message.to, message);
    } else {
      console.warn(`Bot not found or inactive: ${message.to}`);
    }
  }

  /**
   * Deliver message to bot
   */
  deliverMessageToBot(botId, message) {
    const botInfo = this.registeredBots.get(botId);
    if (botInfo && botInfo.instance) {
      try {
        // Call bot's message handler
        if (typeof botInfo.instance.handleMessage === 'function') {
          botInfo.instance.handleMessage(message);
        } else {
          // Fallback: dispatch custom event
          const event = new CustomEvent('bot-message-received', {
            detail: message
          });
          window.dispatchEvent(event);
        }
        
        // Update bot stats
        botInfo.messageCount++;
        botInfo.lastMessage = Date.now();
        
      } catch (error) {
        console.error(`Error delivering message to ${botId}:`, error);
        botInfo.errorCount++;
      }
    }
  }

  /**
   * Handle protocol-specific messages
   */
  handleProtocolMessage(message) {
    switch (message.data?.command) {
      case 'register':
        this.handleRegistrationRequest(message);
        break;
      case 'status':
        this.handleStatusRequest(message);
        break;
      case 'capabilities':
        this.handleCapabilitiesRequest(message);
        break;
      default:
        console.warn('Unknown protocol command:', message.data?.command);
    }
  }

  /**
   * Handle registration request
   */
  handleRegistrationRequest(message) {
    const response = {
      type: this.messageTypes.RESPONSE,
      from: 'protocol',
      to: message.from,
      data: {
        command: 'register',
        success: true,
        botId: message.from,
        registeredBots: Array.from(this.registeredBots.keys())
      }
    };
    
    this.sendMessage(response);
  }

  /**
   * Handle status request
   */
  handleStatusRequest(message) {
    const botInfo = this.registeredBots.get(message.from);
    const response = {
      type: this.messageTypes.RESPONSE,
      from: 'protocol',
      to: message.from,
      data: {
        command: 'status',
        botStatus: botInfo ? {
          id: botInfo.id,
          status: botInfo.status,
          capabilities: botInfo.capabilities,
          messageCount: botInfo.messageCount,
          errorCount: botInfo.errorCount,
          lastHeartbeat: botInfo.lastHeartbeat
        } : null,
        protocolStatus: {
          registeredBots: this.registeredBots.size,
          queueSize: this.messageQueue.length,
          historySize: this.messageHistory.length
        }
      }
    };
    
    this.sendMessage(response);
  }

  /**
   * Handle capabilities request
   */
  handleCapabilitiesRequest(message) {
    const allCapabilities = {};
    this.registeredBots.forEach((botInfo, botId) => {
      allCapabilities[botId] = botInfo.capabilities;
    });
    
    const response = {
      type: this.messageTypes.RESPONSE,
      from: 'protocol',
      to: message.from,
      data: {
        command: 'capabilities',
        capabilities: allCapabilities
      }
    };
    
    this.sendMessage(response);
  }

  /**
   * Send heartbeat
   */
  sendHeartbeat() {
    const heartbeat = {
      type: this.messageTypes.HEARTBEAT,
      from: 'protocol',
      to: 'all',
      data: {
        timestamp: Date.now(),
        protocolVersion: this.protocolVersion
      }
    };
    
    this.sendMessage(heartbeat);
  }

  /**
   * Check bot health
   */
  checkBotHealth() {
    const now = Date.now();
    const heartbeatTimeout = 120000; // 2 minutes
    
    this.registeredBots.forEach((botInfo, botId) => {
      if (now - botInfo.lastHeartbeat > heartbeatTimeout) {
        botInfo.status = 'inactive';
        console.warn(`Bot ${botId} is inactive (no heartbeat)`);
        
        // Notify other bots
        this.broadcastMessage({
          type: this.messageTypes.NOTIFICATION,
          from: 'protocol',
          to: 'all',
          data: {
            event: 'bot_inactive',
            botId: botId,
            reason: 'no_heartbeat'
          }
        });
      }
    });
  }

  /**
   * Handle incoming message
   */
  handleIncomingMessage(message) {
    this.messageQueue.push(message);
  }

  /**
   * Handle protocol error
   */
  handleProtocolError(error) {
    const errorMessage = {
      type: this.messageTypes.ERROR,
      from: 'protocol',
      to: 'all',
      data: {
        error: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: Date.now()
      }
    };
    
    this.sendMessage(errorMessage);
    
    console.error('Protocol error:', error);
  }

  /**
   * Handle message error
   */
  handleMessageError(message, error) {
    const errorMessage = {
      type: this.messageTypes.ERROR,
      from: 'protocol',
      to: message.from,
      data: {
        originalMessage: message,
        error: error.message || 'Message processing error',
        timestamp: Date.now()
      }
    };
    
    this.sendMessage(errorMessage);
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(botId, messageTypes, callback) {
    if (!this.subscriptions.has(botId)) {
      this.subscriptions.set(botId, new Map());
    }
    
    messageTypes.forEach(type => {
      this.subscriptions.get(botId).set(type, callback);
    });
  }

  /**
   * Unsubscribe from message types
   */
  unsubscribe(botId, messageTypes) {
    if (this.subscriptions.has(botId)) {
      messageTypes.forEach(type => {
        this.subscriptions.get(botId).delete(type);
      });
    }
  }

  /**
   * Request data from another bot
   */
  requestData(fromBot, toBot, dataType, callback) {
    const requestId = this.generateMessageId();
    
    const request = {
      type: this.messageTypes.REQUEST,
      from: fromBot,
      to: toBot,
      data: {
        requestId: requestId,
        dataType: dataType,
        timestamp: Date.now()
      }
    };
    
    // Set up response handler
    const responseHandler = (message) => {
      if (message.data?.requestId === requestId) {
        this.unsubscribe(fromBot, [this.messageTypes.RESPONSE]);
        if (callback) callback(message.data);
      }
    };
    
    this.subscribe(fromBot, [this.messageTypes.RESPONSE], responseHandler);
    this.sendMessage(request);
    
    return requestId;
  }

  /**
   * Respond to a data request
   */
  respondToRequest(originalMessage, data) {
    const response = {
      type: this.messageTypes.RESPONSE,
      from: this.getCurrentBotId(),
      to: originalMessage.from,
      data: {
        requestId: originalMessage.data.requestId,
        dataType: originalMessage.data.dataType,
        data: data,
        timestamp: Date.now()
      }
    };
    
    this.sendMessage(response);
  }

  /**
   * Get current bot ID (helper method)
   */
  getCurrentBotId() {
    // This would be implemented by each bot to return its own ID
    return 'unknown';
  }

  /**
   * Save message history
   */
  saveMessageHistory() {
    try {
      const historyToSave = this.messageHistory.slice(-100); // Keep last 100 messages
      localStorage.setItem('bot-message-history', JSON.stringify(historyToSave));
    } catch (error) {
      console.warn('Failed to save message history:', error);
    }
  }

  /**
   * Get communication insights
   */
  getCommunicationInsights() {
    const insights = {
      protocolVersion: this.protocolVersion,
      registeredBots: this.registeredBots.size,
      activeBots: Array.from(this.registeredBots.values()).filter(bot => bot.status === 'active').length,
      messageQueueSize: this.messageQueue.length,
      messageHistorySize: this.messageHistory.length,
      totalMessagesSent: this.messageHistory.length,
      botStats: {},
      messageStats: {
        byType: {},
        byPriority: {},
        errors: 0
      }
    };
    
    // Calculate bot statistics
    this.registeredBots.forEach((botInfo, botId) => {
      insights.botStats[botId] = {
        status: botInfo.status,
        capabilities: botInfo.capabilities,
        messageCount: botInfo.messageCount,
        errorCount: botInfo.errorCount,
        lastHeartbeat: botInfo.lastHeartbeat
      };
    });
    
    // Calculate message statistics
    this.messageHistory.forEach(message => {
      // By type
      insights.messageStats.byType[message.type] = (insights.messageStats.byType[message.type] || 0) + 1;
      
      // By priority
      insights.messageStats.byPriority[message.priority] = (insights.messageStats.byPriority[message.priority] || 0) + 1;
      
      // Errors
      if (message.type === this.messageTypes.ERROR) {
        insights.messageStats.errors++;
      }
    });
    
    return insights;
  }

  /**
   * Export communication data
   */
  exportCommunicationData() {
    return {
      protocolVersion: this.protocolVersion,
      registeredBots: Object.fromEntries(this.registeredBots),
      messageHistory: this.messageHistory,
      subscriptions: Object.fromEntries(this.subscriptions),
      insights: this.getCommunicationInsights()
    };
  }

  /**
   * Destroy communication protocol
   */
  destroy() {
    // Clear all data structures
    this.registeredBots.clear();
    this.messageQueue = [];
    this.messageHistory = [];
    this.subscriptions.clear();
    
    // Save final message history
    this.saveMessageHistory();
    
    console.log('🤖 Bot Communication Protocol destroyed');
  }
}

// Initialize Bot Communication Protocol when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.botCommunicationProtocol = new BotCommunicationProtocol();
  console.log('🤖 Bot Communication Protocol integrated with IZA OS Dashboard');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BotCommunicationProtocol;
}
