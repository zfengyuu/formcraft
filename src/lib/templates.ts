import { createFieldFromType } from "@/lib/field-definitions";
import { createRowFromPreset } from "@/lib/layout-presets";
import { createId } from "@/lib/utils";
import type { FieldType, FormField, FormRow, FormSchema } from "@/types/form";

export type FormTemplateId =
  | "contact"
  | "job-application"
  | "customer-intake"
  | "feedback"
  | "event-registration"
  | "newsletter-signup"
  | "support-request"
  | "survey"
  | "lead-capture"
  | "bug-report";

export type FormTemplate = {
  id: FormTemplateId;
  title: string;
  description: string;
};

export const formTemplates: FormTemplate[] = [
  { id: "contact", title: "Contact Form", description: "Name, email, phone, and message" },
  { id: "job-application", title: "Job Application", description: "Candidate profile, role, resume, and consent" },
  { id: "customer-intake", title: "Customer Intake", description: "Business details, needs, timeline, and budget" },
  { id: "feedback", title: "Feedback", description: "Rating, comments, and follow-up preference" },
  { id: "event-registration", title: "Event Registration", description: "Attendee details and ticket choices" },
  { id: "newsletter-signup", title: "Newsletter Signup", description: "Email capture and content preferences" },
  { id: "support-request", title: "Support Request", description: "Issue category, priority, and attachments" },
  { id: "survey", title: "Survey", description: "Questionnaire starter with mixed inputs" },
  { id: "lead-capture", title: "Lead Capture", description: "Qualified lead capture for sales teams" },
  { id: "bug-report", title: "Bug Report", description: "Reproduction details and environment" },
];

function makeField(type: FieldType, existing: FormField[], updates: Partial<FormField> = {}) {
  const field = createFieldFromType(type, existing);
  const next: FormField = {
    ...field,
    ...updates,
    validation: updates.validation ? { ...field.validation, ...updates.validation } : field.validation,
    settings: { ...(field.settings ?? {}), ...(updates.settings ?? {}) },
    options: updates.options ?? field.options,
  };
  existing.push(next);
  return next;
}

function makeRow(preset: Parameters<typeof createRowFromPreset>[0], columns: FormField[][]): FormRow {
  const row = createRowFromPreset(preset);
  row.columns = row.columns.map((column, index) => ({
    ...column,
    fields: columns[index] ?? [],
  }));
  return row;
}

function buildTemplateFields(templateId: FormTemplateId) {
  const fields: FormField[] = [];

  switch (templateId) {
    case "job-application":
      return [
        makeRow("two-equal", [
          [makeField("text", fields, { label: "Full name", name: "fullName", required: true })],
          [makeField("email", fields, { label: "Email", name: "email", required: true })],
        ]),
        makeRow("two-equal", [
          [makeField("select", fields, { label: "Role", name: "role", required: true, options: roleOptions() })],
          [makeField("file", fields, { label: "Resume", name: "resume", required: true })],
        ]),
        makeRow("one", [[makeField("textarea", fields, { label: "Why are you interested?", name: "coverNote" })]]),
      ];
    case "customer-intake":
      return [
        makeRow("two-equal", [
          [makeField("text", fields, { label: "Company", name: "company", required: true })],
          [makeField("email", fields, { label: "Work email", name: "workEmail", required: true })],
        ]),
        makeRow("one-third-two-thirds", [
          [makeField("select", fields, { label: "Budget", name: "budget", options: budgetOptions() })],
          [makeField("textarea", fields, { label: "Project goals", name: "projectGoals", required: true })],
        ]),
      ];
    case "feedback":
      return [
        makeRow("one", [[makeField("radio", fields, { label: "Overall rating", name: "overallRating", required: true, options: ratingOptions() })]]),
        makeRow("one", [[makeField("textarea", fields, { label: "What should we improve?", name: "improvements" })]]),
        makeRow("two-equal", [
          [makeField("switch", fields, { label: "May we follow up?", name: "followUp" })],
          [makeField("email", fields, { label: "Email", name: "email", required: false })],
        ]),
      ];
    case "event-registration":
      return [
        makeRow("two-equal", [
          [makeField("text", fields, { label: "Attendee name", name: "attendeeName", required: true })],
          [makeField("email", fields, { label: "Email", name: "email", required: true })],
        ]),
        makeRow("two-equal", [
          [makeField("select", fields, { label: "Ticket type", name: "ticketType", required: true, options: ticketOptions() })],
          [makeField("date", fields, { label: "Arrival date", name: "arrivalDate" })],
        ]),
      ];
    case "newsletter-signup":
      return [
        makeRow("one", [[makeField("email", fields, { label: "Email address", name: "emailAddress", required: true })]]),
        makeRow("one", [[makeField("checkbox", fields, { label: "Topics", name: "topics", settings: { checkboxLabel: "Product updates and tips" } })]]),
      ];
    case "support-request":
      return [
        makeRow("two-equal", [
          [makeField("email", fields, { label: "Contact email", name: "contactEmail", required: true })],
          [makeField("select", fields, { label: "Priority", name: "priority", options: priorityOptions() })],
        ]),
        makeRow("one", [[makeField("textarea", fields, { label: "Issue details", name: "issueDetails", required: true })]]),
        makeRow("one", [[makeField("file", fields, { label: "Attachment", name: "attachment" })]]),
      ];
    case "survey":
      return [
        makeRow("one", [[makeField("text", fields, { label: "Question 1", name: "question1", required: true })]]),
        makeRow("one", [[makeField("radio", fields, { label: "How likely are you to recommend us?", name: "nps", options: ratingOptions() })]]),
        makeRow("one", [[makeField("textarea", fields, { label: "Additional comments", name: "comments" })]]),
      ];
    case "lead-capture":
      return [
        makeRow("two-equal", [
          [makeField("text", fields, { label: "Name", name: "name", required: true })],
          [makeField("email", fields, { label: "Business email", name: "businessEmail", required: true })],
        ]),
        makeRow("two-equal", [
          [makeField("phone", fields, { label: "Phone", name: "phone" })],
          [makeField("select", fields, { label: "Company size", name: "companySize", options: companySizeOptions() })],
        ]),
      ];
    case "bug-report":
      return [
        makeRow("one", [[makeField("text", fields, { label: "Bug title", name: "bugTitle", required: true })]]),
        makeRow("two-equal", [
          [makeField("select", fields, { label: "Severity", name: "severity", options: severityOptions() })],
          [makeField("text", fields, { label: "Environment", name: "environment" })],
        ]),
        makeRow("one", [[makeField("textarea", fields, { label: "Steps to reproduce", name: "stepsToReproduce", required: true })]]),
      ];
    case "contact":
    default:
      return [
        makeRow("two-equal", [
          [makeField("text", fields, { label: "Full name", name: "fullName", required: true })],
          [makeField("email", fields, { label: "Email", name: "email", required: true })],
        ]),
        makeRow("two-equal", [
          [makeField("phone", fields, { label: "Phone", name: "phone" })],
          [makeField("select", fields, { label: "Reason", name: "reason", options: reasonOptions() })],
        ]),
        makeRow("one", [[makeField("textarea", fields, { label: "Message", name: "message", required: true })]]),
      ];
  }
}

export function createTemplateForm(templateId: FormTemplateId): FormSchema {
  const template = formTemplates.find((item) => item.id === templateId) ?? formTemplates[0]!;
  const timestamp = new Date().toISOString();

  return {
    id: createId("form"),
    title: template.title,
    description: template.description,
    layout: {
      sections: [
        {
          id: createId("section"),
          type: "section",
          title: template.title,
          description: template.description,
          rows: buildTemplateFields(template.id),
          settings: { showTitle: true, variant: "plain", padding: "md" },
        },
      ],
    },
    settings: {
      submitButtonText: "Submit",
      maxWidth: "standard",
      spacing: "comfortable",
      theme: "light",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function option(label: string, value: string) {
  return { id: createId("option"), label, value };
}

function roleOptions() {
  return [option("Designer", "designer"), option("Engineer", "engineer"), option("Product", "product")];
}

function budgetOptions() {
  return [option("Under $10k", "under-10k"), option("$10k-$50k", "10k-50k"), option("$50k+", "50k-plus")];
}

function ratingOptions() {
  return [option("1", "1"), option("2", "2"), option("3", "3"), option("4", "4"), option("5", "5")];
}

function ticketOptions() {
  return [option("General", "general"), option("VIP", "vip"), option("Workshop", "workshop")];
}

function priorityOptions() {
  return [option("Low", "low"), option("Normal", "normal"), option("High", "high")];
}

function companySizeOptions() {
  return [option("1-10", "1-10"), option("11-50", "11-50"), option("51+", "51-plus")];
}

function severityOptions() {
  return [option("Minor", "minor"), option("Major", "major"), option("Critical", "critical")];
}

function reasonOptions() {
  return [option("Sales", "sales"), option("Support", "support"), option("Partnership", "partnership")];
}
