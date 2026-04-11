export type OrgNode = {
  id: string;
  name: string;
  code?: string | null;
};

export type CurriculumTree = {
  university: OrgNode;
  faculty: OrgNode;
  program: OrgNode;
  curriculum: OrgNode;
  level: OrgNode;
  term: OrgNode;
};

export type OrgServiceContract = {
  getCurriculumTree: (tenantKey: string, termId: string) => Promise<CurriculumTree | null>;
  listFaculties: (tenantKey: string) => Promise<OrgNode[]>;
};
