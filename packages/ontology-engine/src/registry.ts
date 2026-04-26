// ============================================
// ABC Express AIP — Ontology Registry
// Runtime registry for querying the ontology
// Provides lookup, validation, and introspection
// ============================================

import type {
  OntologyManifest,
  ObjectTypeDefinition,
  LinkTypeDefinition,
  ActionTypeDefinition,
  FunctionDefinition,
  PropertyDefinition,
} from './types.js';
import { ALL_OBJECT_TYPES } from './objects.js';
import { ALL_LINK_TYPES } from './links.js';
import { ALL_ACTION_TYPES } from './actions.js';
import { ALL_FUNCTIONS } from './functions.js';

// ─── Manifest ───────────────────────────────────────────────

export const ONTOLOGY_MANIFEST: OntologyManifest = {
  version: '1.0.0',
  name: 'abc-express-ontology',
  description: 'ABC Express logistics platform ontology — objects, links, actions, and functions for operations and finance.',
  objectTypes: ALL_OBJECT_TYPES,
  linkTypes: ALL_LINK_TYPES,
  actionTypes: ALL_ACTION_TYPES,
  functions: ALL_FUNCTIONS,
};

// ─── Registry class ─────────────────────────────────────────

export class OntologyRegistry {
  private objectTypeMap: Map<string, ObjectTypeDefinition>;
  private linkTypeMap: Map<string, LinkTypeDefinition>;
  private actionTypeMap: Map<string, ActionTypeDefinition>;
  private functionMap: Map<string, FunctionDefinition>;

  // Reverse indexes
  private linksBySource: Map<string, LinkTypeDefinition[]>;
  private linksByTarget: Map<string, LinkTypeDefinition[]>;
  private actionsByObjectType: Map<string, ActionTypeDefinition[]>;
  private functionsByObjectType: Map<string, FunctionDefinition[]>;

  constructor(manifest: OntologyManifest = ONTOLOGY_MANIFEST) {
    // Primary maps
    this.objectTypeMap = new Map(manifest.objectTypes.map((o) => [o.apiName, o]));
    this.linkTypeMap = new Map(manifest.linkTypes.map((l) => [l.apiName, l]));
    this.actionTypeMap = new Map(manifest.actionTypes.map((a) => [a.apiName, a]));
    this.functionMap = new Map(manifest.functions.map((f) => [f.apiName, f]));

    // Reverse indexes
    this.linksBySource = new Map();
    this.linksByTarget = new Map();
    for (const link of manifest.linkTypes) {
      const src = this.linksBySource.get(link.sourceObjectType) ?? [];
      src.push(link);
      this.linksBySource.set(link.sourceObjectType, src);

      const tgt = this.linksByTarget.get(link.targetObjectType) ?? [];
      tgt.push(link);
      this.linksByTarget.set(link.targetObjectType, tgt);
    }

    this.actionsByObjectType = new Map();
    for (const action of manifest.actionTypes) {
      for (const objType of action.objectTypes) {
        const actions = this.actionsByObjectType.get(objType) ?? [];
        actions.push(action);
        this.actionsByObjectType.set(objType, actions);
      }
    }

    this.functionsByObjectType = new Map();
    for (const fn of manifest.functions) {
      for (const objType of fn.inputObjectTypes) {
        const fns = this.functionsByObjectType.get(objType) ?? [];
        fns.push(fn);
        this.functionsByObjectType.set(objType, fns);
      }
    }
  }

  // ── Object Types ──────────────────────────────────────────

  getObjectType(apiName: string): ObjectTypeDefinition | undefined {
    return this.objectTypeMap.get(apiName);
  }

  getAllObjectTypes(): ObjectTypeDefinition[] {
    return Array.from(this.objectTypeMap.values());
  }

  getObjectTypesByTag(tag: string): ObjectTypeDefinition[] {
    return this.getAllObjectTypes().filter((o) => o.tags.includes(tag));
  }

  getObjectTypeProperty(objectApiName: string, propertyKey: string): PropertyDefinition | undefined {
    const obj = this.objectTypeMap.get(objectApiName);
    return obj?.properties.find((p) => p.key === propertyKey);
  }

  getSearchableProperties(objectApiName: string): PropertyDefinition[] {
    const obj = this.objectTypeMap.get(objectApiName);
    return obj?.properties.filter((p) => p.searchable) ?? [];
  }

  getFilterableProperties(objectApiName: string): PropertyDefinition[] {
    const obj = this.objectTypeMap.get(objectApiName);
    return obj?.properties.filter((p) => p.filterable) ?? [];
  }

  getSortableProperties(objectApiName: string): PropertyDefinition[] {
    const obj = this.objectTypeMap.get(objectApiName);
    return obj?.properties.filter((p) => p.sortable) ?? [];
  }

  // ── Link Types ────────────────────────────────────────────

  getLinkType(apiName: string): LinkTypeDefinition | undefined {
    return this.linkTypeMap.get(apiName);
  }

  getAllLinkTypes(): LinkTypeDefinition[] {
    return Array.from(this.linkTypeMap.values());
  }

  getLinksFromObjectType(objectApiName: string): LinkTypeDefinition[] {
    return this.linksBySource.get(objectApiName) ?? [];
  }

  getLinksToObjectType(objectApiName: string): LinkTypeDefinition[] {
    return this.linksByTarget.get(objectApiName) ?? [];
  }

  getRelatedObjectTypes(objectApiName: string): string[] {
    const outbound = this.getLinksFromObjectType(objectApiName).map((l) => l.targetObjectType);
    const inbound = this.getLinksToObjectType(objectApiName).map((l) => l.sourceObjectType);
    return [...new Set([...outbound, ...inbound])];
  }

  // ── Action Types ──────────────────────────────────────────

  getActionType(apiName: string): ActionTypeDefinition | undefined {
    return this.actionTypeMap.get(apiName);
  }

  getAllActionTypes(): ActionTypeDefinition[] {
    return Array.from(this.actionTypeMap.values());
  }

  getActionsForObjectType(objectApiName: string): ActionTypeDefinition[] {
    return this.actionsByObjectType.get(objectApiName) ?? [];
  }

  getActionsRequiringApproval(): ActionTypeDefinition[] {
    return this.getAllActionTypes().filter((a) => a.requiresApproval);
  }

  getActionsForRole(role: string): ActionTypeDefinition[] {
    return this.getAllActionTypes().filter((a) => a.allowedRoles.includes(role));
  }

  // ── Functions ─────────────────────────────────────────────

  getFunction(apiName: string): FunctionDefinition | undefined {
    return this.functionMap.get(apiName);
  }

  getAllFunctions(): FunctionDefinition[] {
    return Array.from(this.functionMap.values());
  }

  getFunctionsForObjectType(objectApiName: string): FunctionDefinition[] {
    return this.functionsByObjectType.get(objectApiName) ?? [];
  }

  getAggregationFunctions(): FunctionDefinition[] {
    return this.getAllFunctions().filter((f) => f.isAggregation);
  }

  getFunctionsForRole(role: string): FunctionDefinition[] {
    return this.getAllFunctions().filter((f) => f.allowedRoles.includes(role));
  }

  // ── Access Control ────────────────────────────────────────

  canRead(objectApiName: string, role: string): boolean {
    const obj = this.objectTypeMap.get(objectApiName);
    return obj?.readRoles.includes(role) ?? false;
  }

  canWrite(objectApiName: string, role: string): boolean {
    const obj = this.objectTypeMap.get(objectApiName);
    return obj?.writeRoles.includes(role) ?? false;
  }

  canExecuteAction(actionApiName: string, role: string): boolean {
    const action = this.actionTypeMap.get(actionApiName);
    return action?.allowedRoles.includes(role) ?? false;
  }

  canInvokeFunction(functionApiName: string, role: string): boolean {
    const fn = this.functionMap.get(functionApiName);
    return fn?.allowedRoles.includes(role) ?? false;
  }

  /** Returns all object types readable by a role */
  getReadableObjectTypes(role: string): ObjectTypeDefinition[] {
    return this.getAllObjectTypes().filter((o) => o.readRoles.includes(role));
  }

  /** Returns all object types writable by a role */
  getWritableObjectTypes(role: string): ObjectTypeDefinition[] {
    return this.getAllObjectTypes().filter((o) => o.writeRoles.includes(role));
  }

  // ── Introspection / AI Context ────────────────────────────

  /** Returns a compact summary for LLM context injection */
  toAIContext(): string {
    const objects = this.getAllObjectTypes().map((o) => {
      const props = o.properties
        .filter((p) => !p.primaryKey)
        .map((p) => `    - ${p.key} (${p.type}${p.unit ? ', ' + p.unit : ''}): ${p.label}`)
        .join('\n');
      return `  ${o.apiName} (${o.displayName}):\n${props}`;
    });

    const links = this.getAllLinkTypes().map(
      (l) => `  ${l.sourceObjectType} → ${l.targetObjectType} (${l.displayName}, ${l.cardinality})`
    );

    const actions = this.getAllActionTypes().map(
      (a) => `  ${a.apiName}: ${a.displayName} [${a.triggers.join(', ')}] → ${a.endpoint}`
    );

    const functions = this.getAllFunctions().map(
      (f) => `  ${f.apiName}: ${f.displayName} → ${f.returnType}${f.isAggregation ? ' (aggregation)' : ''}`
    );

    return [
      '=== ABC Express Ontology ===',
      '',
      'OBJECT TYPES:',
      ...objects,
      '',
      'LINKS:',
      ...links,
      '',
      'ACTIONS:',
      ...actions,
      '',
      'FUNCTIONS:',
      ...functions,
    ].join('\n');
  }

  /** Returns full manifest for serialization */
  getManifest(): OntologyManifest {
    return ONTOLOGY_MANIFEST;
  }

  /** Summary stats */
  getStats() {
    return {
      objectTypes: this.objectTypeMap.size,
      linkTypes: this.linkTypeMap.size,
      actionTypes: this.actionTypeMap.size,
      functions: this.functionMap.size,
      totalProperties: this.getAllObjectTypes().reduce((sum, o) => sum + o.properties.length, 0),
    };
  }
}

// ─── Singleton instance ─────────────────────────────────────

export const ontologyRegistry = new OntologyRegistry();
