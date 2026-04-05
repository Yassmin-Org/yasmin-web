"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "./photo-upload";
import { CheckoutProgress } from "./checkout-progress";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Types matching backend FieldType enum
type FieldType =
  | "TEXT"
  | "DATE"
  | "DROPDOWN"
  | "EMAIL"
  | "PHONE"
  | "YES_NO"
  | "UPLOAD"
  | "COUNTRY"
  | "ZIP_CODE"
  | "TOS_LINK";

interface FieldValidation {
  key: string;
  message: string;
  value?: number;
  condition?: { field: string; equals: string };
}

interface FieldInfo {
  key: string;
  type: FieldType;
  label: string;
  infoText: string;
  placeholder?: string;
  placeholders?: { month: string; day: string; year: string };
  order: number;
  optionsEndpoint?: string;
  validations: FieldValidation[];
  value?: string | boolean;
  valueKey?: string;
}

interface NestedFieldGroup {
  key: string;
  order: number;
  fields: FieldInfo[];
}

interface FormResponse {
  title: string;
  description: string;
  fields?: FieldInfo[];
  nestedFields?: NestedFieldGroup[];
  buttonRules?: Array<{
    conditions: Record<string, string[]>;
    submit: boolean;
    label?: string;
  }>;
  autofill?: { email?: string; phoneNumber?: string };
}

interface CheckoutKycFormProps {
  provider: "walapay" | "bridge";
  token: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export function CheckoutKycForm({
  provider,
  token,
  onComplete,
  onError,
}: CheckoutKycFormProps) {
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [allSubmittedData, setAllSubmittedData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stepNumber, setStepNumber] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5); // estimate
  const [dropdownOptions, setDropdownOptions] = useState<
    Record<string, Array<{ key: string; label: string }>>
  >({});

  const headers = { Authorization: `Bearer ${token}` };

  // Get first step via navigation
  const getFirstStep = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/kyc/navigation`,
        {},
        { headers }
      );
      const data = res.data?.data || res.data;
      const nextFlow = data?.nextFlow;
      if (nextFlow) {
        setCurrentFlow(nextFlow);
        await loadFormStep(nextFlow);
      } else {
        // No steps needed — KYC already done
        onComplete();
      }
    } catch (err) {
      onError("Failed to start verification process");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load form schema for a specific step
  const loadFormStep = async (flowKey: string) => {
    setLoading(true);
    try {
      const prefix = provider === "bridge" ? "bridge" : "walapay";
      const res = await axios.get(`${API_URL}/${prefix}/kyc/${flowKey}`, {
        headers,
      });
      const data = res.data?.data || res.data;
      setFormData(data);

      // Pre-populate form values from existing data
      const values: Record<string, unknown> = {};
      const allFields = getAllFields(data);
      for (const field of allFields) {
        if (field.value !== undefined) {
          values[field.key] = field.value;
        }
      }
      // Add autofill values
      if (data?.autofill) {
        if (data.autofill.email) values.email = data.autofill.email;
        if (data.autofill.phoneNumber)
          values.phoneNumber = data.autofill.phoneNumber;
      }
      setFormValues(values);

      // Load dropdown options for any DROPDOWN fields
      for (const field of allFields) {
        if (
          (field.type === "DROPDOWN" || field.type === "COUNTRY") &&
          field.optionsEndpoint
        ) {
          loadDropdownOptions(field.key, field.optionsEndpoint);
        }
      }
    } catch {
      onError("Failed to load verification form");
    }
    setLoading(false);
  };

  // Load dropdown options from endpoint
  const loadDropdownOptions = async (fieldKey: string, endpoint: string) => {
    try {
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_URL}${endpoint.startsWith("/api") ? endpoint.replace("/api", "") : endpoint}`;
      const res = await axios.get(url, { headers });
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setDropdownOptions((prev) => ({ ...prev, [fieldKey]: data }));
      }
    } catch {
      // Options load failed — field will show empty dropdown
    }
  };

  // Get all fields from form data (flat + nested)
  const getAllFields = (data: FormResponse | null): FieldInfo[] => {
    if (!data) return [];
    const fields: FieldInfo[] = [...(data.fields || [])];
    for (const group of data.nestedFields || []) {
      fields.push(...group.fields);
    }
    return fields.sort((a, b) => a.order - b.order);
  };

  // Submit current step and navigate to next
  const handleSubmit = async () => {
    if (!currentFlow) return;
    setSubmitting(true);

    try {
      const prefix = provider === "bridge" ? "bridge" : "walapay";

      // Submit form data for this step
      await axios.post(`${API_URL}/${prefix}/kyc`, formValues, { headers });

      // Merge with all submitted data
      const merged = { ...allSubmittedData, ...formValues };
      setAllSubmittedData(merged);

      // Get next step
      const navRes = await axios.post(
        `${API_URL}/kyc/navigation`,
        { currentFlow, ...merged },
        { headers }
      );
      const navData = navRes.data?.data || navRes.data;
      const nextFlow = navData?.nextFlow;

      if (nextFlow) {
        setCurrentFlow(nextFlow);
        setStepNumber((s) => s + 1);
        await loadFormStep(nextFlow);
      } else {
        // All steps complete
        onComplete();
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to submit verification data";
      onError(msg);
    }
    setSubmitting(false);
  };

  // Initialize
  useEffect(() => {
    getFirstStep();
  }, [getFirstStep]);

  // Update form value
  const setValue = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CheckoutProgress currentStep={3} totalSteps={5} />
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
          <p className="text-sm text-gray-500">Loading verification form...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-4">
        <CheckoutProgress currentStep={3} totalSteps={5} />
        <p className="text-center text-sm text-red-600">
          Could not load verification form
        </p>
      </div>
    );
  }

  const allFields = getAllFields(formData);

  return (
    <div className="space-y-4">
      <CheckoutProgress currentStep={3} totalSteps={5} />
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {formData.title}
        </h2>
        <p className="text-xs text-gray-500">{formData.description}</p>
      </div>

      <div className="space-y-3">
        {allFields.map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={formValues[field.key]}
            onChange={(val) => setValue(field.key, val)}
            dropdownOptions={dropdownOptions[field.key]}
            allValues={formValues}
          />
        ))}
      </div>

      <Button
        size="lg"
        className="w-full"
        loading={submitting}
        onClick={handleSubmit}
      >
        Continue
      </Button>
    </div>
  );
}

// Dynamic field renderer
function DynamicField({
  field,
  value,
  onChange,
  dropdownOptions,
  allValues,
}: {
  field: FieldInfo;
  value: unknown;
  onChange: (val: unknown) => void;
  dropdownOptions?: Array<{ key: string; label: string }>;
  allValues: Record<string, unknown>;
}) {
  // Check conditional visibility
  for (const validation of field.validations) {
    if (validation.condition) {
      const depValue = allValues[validation.condition.field];
      if (depValue !== validation.condition.equals) {
        // Condition not met — could hide or skip
      }
    }
  }

  switch (field.type) {
    case "TEXT":
    case "EMAIL":
    case "ZIP_CODE":
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          type={field.type === "EMAIL" ? "email" : "text"}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          hint={field.infoText}
        />
      );

    case "PHONE":
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          type="tel"
          inputMode="numeric"
          value={(value as string) || ""}
          onChange={(e) =>
            onChange(e.target.value.replace(/[^0-9+]/g, ""))
          }
          hint={field.infoText}
        />
      );

    case "DATE":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-yasmin focus:outline-none focus:ring-2 focus:ring-yasmin"
          />
          {field.infoText && (
            <p className="text-xs text-gray-500">{field.infoText}</p>
          )}
        </div>
      );

    case "DROPDOWN":
    case "COUNTRY":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-yasmin focus:outline-none focus:ring-2 focus:ring-yasmin"
          >
            <option value="">{field.placeholder || "Select..."}</option>
            {(dropdownOptions || []).map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          {field.infoText && (
            <p className="text-xs text-gray-500">{field.infoText}</p>
          )}
        </div>
      );

    case "YES_NO":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                value === true
                  ? "border-yasmin bg-yasmin/10 text-yasmin-dark"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                value === false
                  ? "border-yasmin bg-yasmin/10 text-yasmin-dark"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              No
            </button>
          </div>
          {field.infoText && (
            <p className="text-xs text-gray-500">{field.infoText}</p>
          )}
        </div>
      );

    case "UPLOAD":
      return (
        <PhotoUpload
          label={field.label}
          infoText={field.infoText}
          value={(value as string) || undefined}
          onUpload={(dataUri) => onChange(dataUri)}
        />
      );

    case "TOS_LINK":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <a
            href={(value as string) || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-yasmin hover:text-yasmin-dark underline"
          >
            {field.placeholder || "View Terms of Service"}
          </a>
        </div>
      );

    default:
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
