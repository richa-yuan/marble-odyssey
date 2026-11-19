// 滚珠奇旅 · Marble Odyssey — 入口
import './style.css'
import { Game } from './core/Game.js'

const game = new Game()

// 调试/测试钩子
window.__game = game
