/**
 * Playbook Step Types and Rollback Mappings for Sprint 8
 */

export type ActionType = 
  | 'block_ip' 
  | 'unblock_ip'
  | 'isolate_host' 
  | 'unisolate_host'
  | 'disable_account' 
  | 'enable_account'
  | 'quarantine_email' 
  | 'unquarantine_email'
  | 'revoke_aws_key'
  | 'notify' 
  | 'create_ticket' 
  | 'human_approval' 
  | 'wait' 
  | 'conditional' 
  | 'run_hunt';

export interface PlaybookStep {
    id: string;
    type: ActionType;
    config: Record<string, any>;
    on_failure: 'continue' | 'stop' | 'rollback';
}

export const ROLLBACK_MAPPING: Record<string, ActionType> = {
    'block_ip': 'unblock_ip',
    'isolate_host': 'unisolate_host',
    'disable_account': 'enable_account',
    'quarantine_email': 'unquarantine_email',
};

export interface ActionResult {
    status: 'success' | 'failed' | 'awaiting_approval' | 'skipped';
    output: any;
    error?: string;
}

export interface RunResult {
    run_id: string;
    status: string;
    steps_completed: number;
    results: any[];
}
