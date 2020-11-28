import {
  ActionType,
  ConfigExtender,
  ConfigurableTaskDefinition,
  EnvironmentExtender,
  TaskArguments
} from '../../../types';
import { RedspotContext } from '../../context';
import * as argumentTypes from '../params/argumentTypes';

/**
 * Creates a task, overriding any previous task with the same name.
 *
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param description The task's description.
 * @param action The task's action.
 * @returns A task definition.
 */
export function task<ArgsT extends TaskArguments>(
  name: string,
  description?: string,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition;

/**
 * Creates a task without description, overriding any previous task
 * with the same name.
 *
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param action The task's action.
 *
 * @returns A task definition.
 */
export function task<ArgsT extends TaskArguments>(
  name: string,
  action: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function task<ArgsT extends TaskArguments>(
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition {
  const ctx = RedspotContext.getRedspotContext();
  const dsl = ctx.tasksDSL;

  if (descriptionOrAction === undefined) {
    return dsl.task(name);
  }

  if (typeof descriptionOrAction !== 'string') {
    return dsl.task(name, descriptionOrAction);
  }

  return dsl.task(name, descriptionOrAction, action);
}

/**
 * Creates a subtask, overriding any previous task with the same name.
 *
 * @remarks The subtasks won't be displayed in the CLI help messages.
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param description The task's description.
 * @param action The task's action.
 * @returns A task definition.
 */
export function subtask<ArgsT extends TaskArguments>(
  name: string,
  description?: string,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition;

/**
 * Creates a subtask without description, overriding any previous
 * task with the same name.
 *
 * @remarks The subtasks won't be displayed in the CLI help messages.
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param action The task's action.
 * @returns A task definition.
 */
export function subtask<ArgsT extends TaskArguments>(
  name: string,
  action: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function subtask<ArgsT extends TaskArguments>(
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition {
  const ctx = RedspotContext.getRedspotContext();
  const dsl = ctx.tasksDSL;

  if (descriptionOrAction === undefined) {
    return dsl.subtask(name);
  }

  if (typeof descriptionOrAction !== 'string') {
    return dsl.subtask(name, descriptionOrAction);
  }

  return dsl.subtask(name, descriptionOrAction, action);
}

// Backwards compatibility alias
export const internalTask = subtask;

export const types = argumentTypes;

/**
 * Register an environment extender what will be run after the
 * Redspot Runtime Environment is initialized.
 *
 * @param extender A function that receives the Redspot Runtime
 * Environment.
 */
export function extendEnvironment(extender: EnvironmentExtender) {
  const ctx = RedspotContext.getRedspotContext();
  const extenderManager = ctx.extendersManager;

  extenderManager.add(extender);
}

export function extendConfig(extender: ConfigExtender) {
  const ctx = RedspotContext.getRedspotContext();

  ctx.configExtenders.push(extender);
}
