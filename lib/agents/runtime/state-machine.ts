import { AgentState } from './types';

const VALID_TRANSITIONS: Record<AgentState, AgentState[]> = {
  IDLE: ['QUEUED', 'ARCHIVED'],
  QUEUED: ['RUNNING', 'ARCHIVED'],
  RUNNING: ['BLOCKED', 'ESCALATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
  BLOCKED: ['RUNNING', 'FAILED', 'ARCHIVED'],
  ESCALATED: ['ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  FAILED: ['RETRYING', 'ARCHIVED'],
  RETRYING: ['RUNNING', 'FAILED', 'ARCHIVED'],
  ARCHIVED: [],
};

export class AgentStateMachine {
  private currentState: AgentState;
  private stateHistory: { state: AgentState; timestamp: string }[] = [];

  constructor(initialState: AgentState = 'IDLE') {
    this.currentState = initialState;
    this.logTransition(initialState);
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public getHistory() {
    return [...this.stateHistory];
  }

  public transitionTo(newState: AgentState): void {
    const allowed = VALID_TRANSITIONS[this.currentState] || [];
    if (!allowed.includes(newState)) {
      throw new Error(`Invalid state transition from ${this.currentState} to ${newState}`);
    }

    this.currentState = newState;
    this.logTransition(newState);
  }

  private logTransition(state: AgentState): void {
    this.stateHistory.push({
      state,
      timestamp: new Date().toISOString(),
    });
  }
}
