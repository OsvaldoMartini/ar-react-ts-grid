import React from 'react';
import {
  ArrowDown,
  CheckCircle2,
  GitBranch,
  Merge,
  PlusCircle,
} from 'lucide-react';
import styles from './VariablesConnectionGraphHelpModal.module.scss';

const IfFamilyHelpGraph: React.FC = () => (
  <div className={styles.graphWorkspace}>
    <section className={styles.graphCard} aria-label="IF family flow graph">
      <div className={styles.graphHeading}>
        <div>
          <span>Conditional family</span>
          <h3>One IF root controls every branch in its Block</h3>
        </div>
        <strong>One IF root per Block</strong>
      </div>

      <div className={styles.ifRootFlow}>
        <article className={`${styles.flowNode} ${styles.decisionNode}`}>
          <GitBranch size={20} aria-hidden="true" />
          <b>IF</b>
          <small>The conditional root connects to itself</small>
        </article>
        <ArrowDown className={styles.downArrow} aria-hidden="true" />
      </div>

      <div className={styles.conditionalBranches}>
        <section className={styles.conditionalLane}>
          <span className={`${styles.branchBadge} ${styles.yesBadge}`}>TRUE</span>
          <article className={`${styles.flowNode} ${styles.actionNode}`}>
            <CheckCircle2 size={20} aria-hidden="true" />
            <b>IF body</b>
            <small>Execute the commands belonging to the true branch</small>
          </article>
        </section>

        <section className={styles.conditionalLane}>
          <span className={`${styles.branchBadge} ${styles.reviewBadge}`}>FALSE</span>
          <article className={`${styles.flowNode} ${styles.commandNode}`}>
            <PlusCircle size={20} aria-hidden="true" />
            <b>ELSEIF × N</b>
            <small>Add any number of ELSEIF branches between IF and ELSE</small>
          </article>
          <article className={`${styles.flowNode} ${styles.neutralNode}`}>
            <b>ELSE</b>
            <small>Runs only when IF and every ELSEIF are false</small>
          </article>
        </section>
      </div>

      <div className={styles.mergeFlow}>
        <Merge size={22} aria-hidden="true" />
        <article className={`${styles.flowNode} ${styles.endNode}`}>
          <b>ENDIF</b>
          <small>Every branch reconnects to the single IF root and exits here</small>
        </article>
      </div>
    </section>

    <aside className={styles.explanationCard}>
      <h3>Required structure</h3>
      <div className={styles.codeSequence}>
        <b>IF</b>
        <span>ELSEIF (optional, repeatable)</span>
        <span>ELSE</span>
        <b>ENDIF</b>
      </div>
      <p>
        Adding IF creates <strong>IF → ELSE → ENDIF</strong> automatically.
        Additional ELSEIF commands may be inserted only between IF and ELSE.
      </p>
    </aside>
  </div>
);

export default IfFamilyHelpGraph;
