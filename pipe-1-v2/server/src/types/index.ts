export type ProjectStatus = 'pending' | 'ingesting' | 'ready' | 'error' | 'refreshing';

export interface ProjectMeta {
  id: string;
  name: string;
  repoUrl: string;
  status: ProjectStatus;
  createdAt: string;
  scannedAt?: string;
  errorMessage?: string;
  description?: string;
  gitHead?: string;
}

export interface TechStackSection {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  buildTools: string[];
  testingTools: string[];
  databases: string[];
  devOps: string[];
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  directories: string[];
}

export interface ArchitectureSection {
  pattern: string;
  layers: ArchitectureLayer[];
  keyDecisions: string[];
  diagramDescription: string;
}

export interface ModuleSection {
  name: string;
  path: string;
  description: string;
  responsibilities: string[];
  exposedAPIs: string[];
  dependencies: string[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  params?: string[];
  body?: string | null;
  response?: string | null;
}

export interface APISection {
  baseUrl?: string | null;
  endpoints: APIEndpoint[];
  authMethod?: string | null;
  patterns: string[];
}

export interface DataModelField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface DataModel {
  name: string;
  description: string;
  fields: DataModelField[];
  relations?: string[];
}

export interface DataModelSection {
  models: DataModel[];
  ormOrDbLibrary?: string | null;
  patterns: string[];
}

export interface ConventionSection {
  fileNaming: string;
  componentNaming: string;
  variableNaming: string;
  functionNaming: string;
  directoryStructure: string;
  codeStyle: string[];
  commitStyle?: string | null;
}

export interface ConstraintSection {
  nodeVersion?: string | null;
  packageManager?: string | null;
  browserSupport?: string[];
  performance?: string[];
  security?: string[];
  dependencies: string[];
  devDependencies: string[];
}

export interface OverviewSection {
  name: string;
  description: string;
  purpose: string;
  mainFeatures: string[];
  targetUsers: string[];
  deploymentType: string;
}

export interface DNASections {
  overview: OverviewSection;
  techStack: TechStackSection;
  architecture: ArchitectureSection;
  modules: ModuleSection[];
  apis: APISection;
  dataModels: DataModelSection;
  conventions: ConventionSection;
  constraints: ConstraintSection;
}

export interface KeyFileSummary {
  path: string;
  summary: string;
}

export interface ProjectDNA {
  projectId: string;
  sections: DNASections;
  generatedAt: string;
  rawContext: {
    directoryTree: string;
    keyFileSummaries: KeyFileSummary[];
  };
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

export interface QueryResult {
  question: string;
  answer: string;
  referencedSections: string[];
  confidence: ConfidenceLevel;
  timestamp: string;
}
