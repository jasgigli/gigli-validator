export interface GigliIssue {
  code: string;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
}

export class GigliError extends Error {
  public issues: GigliIssue[];

  constructor(issues: GigliIssue[]) {
    const summary = issues.map((i) => `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`).join('; ');
    super(summary || 'Validation failed');
    this.name = 'GigliError';
    this.issues = issues;

    Object.setPrototypeOf(this, GigliError.prototype);
  }

  public flatten(): { formErrors: string[]; fieldErrors: Record<string, string[]> } {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        formErrors.push(issue.message);
      } else {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) {
          fieldErrors[key] = [];
        }
        fieldErrors[key].push(issue.message);
      }
    }

    return { formErrors, fieldErrors };
  }

  public format(): Record<string, any> {
    const formatted: Record<string, any> = { _errors: [] };

    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        formatted._errors.push(issue.message);
      } else {
        let curr = formatted;
        for (let i = 0; i < issue.path.length; i++) {
          const seg = issue.path[i];
          if (!curr[seg]) {
            curr[seg] = { _errors: [] };
          }
          if (i === issue.path.length - 1) {
            curr[seg]._errors.push(issue.message);
          } else {
            curr = curr[seg];
          }
        }
      }
    }

    return formatted;
  }
}
