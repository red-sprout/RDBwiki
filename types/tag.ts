export type TagType = "DBMS" | "TOPIC" | "ADVANCED" | "OPERATION" | "CASE" | "INTERNAL";

export type Tag = {
  id: string;
  name: string;
  type: TagType;
  created_at: string;
};
