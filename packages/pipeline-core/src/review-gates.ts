export interface StraightThroughAssessment {
  hasCriticalValidationError: boolean;
  hasHighSeverityRiskBlock: boolean;
  requiredFieldsMeetThreshold: boolean;
  workflowAllowsAutoProgress: boolean;
}

export function canStraightThroughProcess(
  assessment: StraightThroughAssessment
): boolean {
  return (
    !assessment.hasCriticalValidationError &&
    !assessment.hasHighSeverityRiskBlock &&
    assessment.requiredFieldsMeetThreshold &&
    assessment.workflowAllowsAutoProgress
  );
}

export interface ReviewGateAssessment {
  hasCriticalLowConfidenceField: boolean;
  hasCriticalValidationFailure: boolean;
  hasHighSeverityRiskSignal: boolean;
  schemaRequiresApproval: boolean;
  exportActionHasConsequences: boolean;
}

export function shouldCreateReviewTask(
  assessment: ReviewGateAssessment
): boolean {
  return (
    assessment.hasCriticalLowConfidenceField ||
    assessment.hasCriticalValidationFailure ||
    assessment.hasHighSeverityRiskSignal ||
    assessment.schemaRequiresApproval ||
    assessment.exportActionHasConsequences
  );
}
