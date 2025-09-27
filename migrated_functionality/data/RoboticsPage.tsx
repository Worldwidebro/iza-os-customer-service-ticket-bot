import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bot, 
  Cpu, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Share2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Activity, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Database, 
  Shield, 
  Globe, 
  Smartphone, 
  Monitor, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star, 
  Heart, 
  MessageSquare, 
  Calendar, 
  Filter, 
  Search, 
  X,
  Wifi,
  WifiOff,
  Battery,
  Camera,
  Mic,
  Speaker,
  Move,
  RotateCw,
  Square,
  Circle,
  Triangle
} from 'lucide-react'

interface Robot {
  id: string
  name: string
  type: 'humanoid' | 'industrial' | 'service' | 'mobile' | 'drone' | 'arm'
  status: 'online' | 'offline' | 'maintenance' | 'error'
  location: string
  battery: number
  tasks: Task[]
  capabilities: string[]
  lastUpdate: number
  uptime: number
  performance: {
    efficiency: number
    accuracy: number
    speed: number
    reliability: number
  }
}

interface Task {
  id: string
  name: string
  type: 'navigation' | 'manipulation' | 'sensing' | 'communication' | 'learning'
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progress: number
  estimatedTime: number
  startTime: number
}

export const RoboticsPage: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([])
  const [activeTab, setActiveTab] = useState<'robots' | 'tasks' | 'analytics'>('robots')
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock robots data
  const mockRobots: Robot[] = [
    {
      id: 'robot_1',
      name: 'Atlas Prime',
      type: 'humanoid',
      status: 'online',
      location: 'Warehouse A',
      battery: 85,
      tasks: [
        { id: 't1', name: 'Inventory Check', type: 'navigation', status: 'running', priority: 'high', progress: 65, estimatedTime: 30, startTime: Date.now() - 1800000 },
        { id: 't2', name: 'Package Sorting', type: 'manipulation', status: 'pending', priority: 'medium', progress: 0, estimatedTime: 45, startTime: 0 }
      ],
      capabilities: ['walking', 'grasping', 'vision', 'speech'],
      lastUpdate: Date.now() - 5000,
      uptime: 99.2,
      performance: { efficiency: 92, accuracy: 96, speed: 88, reliability: 94 }
    },
    {
      id: 'robot_2',
      name: 'Kuka Arm Pro',
      type: 'arm',
      status: 'online',
      location: 'Assembly Line B',
      battery: 100,
      tasks: [
        { id: 't3', name: 'Component Assembly', type: 'manipulation', status: 'running', priority: 'critical', progress: 40, estimatedTime: 60, startTime: Date.now() - 2400000 }
      ],
      capabilities: ['precision', 'welding', 'painting', 'quality_check'],
      lastUpdate: Date.now() - 2000,
      uptime: 99.8,
      performance: { efficiency: 98, accuracy: 99, speed: 85, reliability: 97 }
    },
    {
      id: 'robot_3',
      name: 'Delivery Bot X1',
      type: 'mobile',
      status: 'maintenance',
      location: 'Service Bay',
      battery: 45,
      tasks: [],
      capabilities: ['navigation', 'delivery', 'communication', 'mapping'],
      lastUpdate: Date.now() - 3600000,
      uptime: 95.5,
      performance: { efficiency: 89, accuracy: 93, speed: 92, reliability: 91 }
    },
    {
      id: 'robot_4',
      name: 'Surveillance Drone',
      type: 'drone',
      status: 'offline',
      location: 'Hangar',
      battery: 0,
      tasks: [],
      capabilities: ['flying', 'surveillance', 'mapping', 'thermal_imaging'],
      lastUpdate: Date.now() - 86400000,
      uptime: 87.3,
      performance: { efficiency: 85, accuracy: 88, speed: 95, reliability: 89 }
    }
  ]

  React.useEffect(() => {
    setRobots(mockRobots)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-500/20'
      case 'offline': return 'text-gray-400 bg-gray-500/20'
      case 'maintenance': return 'text-yellow-400 bg-yellow-500/20'
      case 'error': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4 text-green-400" />
      case 'offline': return <WifiOff className="w-4 h-4 text-gray-400" />
      case 'maintenance': return <Settings className="w-4 h-4 text-yellow-400" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'humanoid': return <Users className="w-4 h-4 text-blue-400" />
      case 'industrial': return <Cpu className="w-4 h-4 text-green-400" />
      case 'service': return <Heart className="w-4 h-4 text-purple-400" />
      case 'mobile': return <Move className="w-4 h-4 text-orange-400" />
      case 'drone': return <Globe className="w-4 h-4 text-cyan-400" />
      case 'arm': return <Square className="w-4 h-4 text-red-400" />
      default: return <Bot className="w-4 h-4 text-gray-400" />
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-400 bg-gray-500/20'
      case 'running': return 'text-blue-400 bg-blue-500/20'
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'failed': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white gradient-text">
              Robotics Control Center
            </h1>
            <p className="text-gray-400 mt-2">
              Monitor and control your robotic workforce
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{robots.length}</p>
            <p className="text-sm text-green-400">Total Robots</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Robots</p>
                <p className="text-xl font-bold text-white">{robots.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Online</p>
                <p className="text-xl font-bold text-white">{robots.filter(r => r.status === 'online').length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Efficiency</p>
                <p className="text-xl font-bold text-white">
                  {Math.round(robots.reduce((sum, r) => sum + r.performance.efficiency, 0) / robots.length)}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center space-x-3">
              <Battery className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Battery</p>
                <p className="text-xl font-bold text-white">
                  {Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex space-x-1 mb-6 overflow-x-auto">
          {[
            { key: 'robots', label: 'Robots', icon: Bot },
            { key: 'tasks', label: 'Tasks', icon: Target },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.key}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setActiveTab(tab.key as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'robots' && (
          <div className="space-y-6">
            {/* Robots Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {robots.map((robot, index) => (
                <motion.div
                  key={robot.id}
                  className="glass-card p-6 cursor-pointer hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => setSelectedRobot(robot)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(robot.type)}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{robot.name}</h3>
                        <p className="text-sm text-gray-400 capitalize">{robot.type} • {robot.location}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(robot.status)}`}>
                      {robot.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Battery</span>
                      <span className="text-white">{robot.battery}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div 
                        className={`h-2 rounded-full ${
                          robot.battery > 50 ? 'bg-green-500' : 
                          robot.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${robot.battery}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-white">{robot.uptime}%</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Tasks</span>
                      <span className="text-white">{robot.tasks.filter(t => t.status === 'running').length}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-medium text-sm mb-2">Capabilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {robot.capabilities.map(capability => (
                        <span key={capability} className="px-2 py-1 bg-white/10 text-white text-xs rounded">
                          {capability.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <motion.button
                      className="flex-1 bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Toggle robot status
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {robot.status === 'online' ? <Pause className="w-4 h-4 inline mr-1" /> : <Play className="w-4 h-4 inline mr-1" />}
                      {robot.status === 'online' ? 'Stop' : 'Start'}
                    </motion.button>
                    
                    <motion.button
                      className="flex-1 bg-green-500/20 text-green-300 px-3 py-2 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRobot(robot)
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      Control
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Robot Button */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add New Robot
              </motion.button>
            </motion.div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {robots.map(robot => (
              <div key={robot.id} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{robot.name} Tasks</h3>
                {robot.tasks.length === 0 ? (
                  <p className="text-gray-400">No active tasks</p>
                ) : (
                  <div className="space-y-3">
                    {robot.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{task.name}</h4>
                            <p className="text-sm text-gray-400 capitalize">{task.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-400">{task.progress}% complete</p>
                          </div>
                          
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <motion.div 
                              className="bg-blue-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center text-gray-400 py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Robot Analytics</h3>
            <p>Detailed performance analytics coming soon...</p>
          </div>
        )}
      </motion.div>

      {/* Robot Detail Modal */}
      {selectedRobot && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedRobot(null)}
        >
          <motion.div
            className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{selectedRobot.name}</h3>
              <motion.button
                className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                onClick={() => setSelectedRobot(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Robot Status</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedRobot.status)}`}>
                      {selectedRobot.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white capitalize">{selectedRobot.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location</span>
                    <span className="text-white">{selectedRobot.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Battery</span>
                    <span className="text-white">{selectedRobot.battery}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-white">{selectedRobot.uptime}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Efficiency</span>
                    <span className="text-white">{selectedRobot.performance.efficiency}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-white">{selectedRobot.performance.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed</span>
                    <span className="text-white">{selectedRobot.performance.speed}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reliability</span>
                    <span className="text-white">{selectedRobot.performance.reliability}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}