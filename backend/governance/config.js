module.exports={
 caseType:'sandboxed_network_as_code_run',initialState:'input_registered',
 states:['input_registered','configuration_validated','sandbox_approved','run_recorded','evaluation_review','write_approval','artifact_sealed','change_queued','applied','rolled_back'],
 createRoles:['network_developer','platform_operator'],assessmentRoles:['network_developer','network_reviewer','security_reviewer','sre'],auditRoles:['platform_operator','security_reviewer','auditor'],connectorRoles:['integration_operator','platform_operator'],
 evidenceKinds:['repository_commit','config_digest','secret_reference_manifest','sandbox_attestation','execution_receipt','artifact_manifest','evaluation_report','telemetry_snapshot','approval_record','change_receipt','rollback_receipt','ticket_receipt'],
 requiredSignals:['inputVersion','configDigest','toolchainVersion','fixtureVersion','sandboxAttested','testsPassed','regressionCount','writeRequested','policyVersion'],
 professionalBoundary:'This service records reproducible plans and sandbox receipts; it cannot execute untrusted code or change a network without independent authorization and an external controlled runner.',
 connectors:[{name:'repository',purpose:'signed commit references'},{name:'ci_cd',purpose:'sandbox run receipts'},{name:'model_provider',purpose:'draft assistance receipts only'},{name:'telemetry',purpose:'versioned observations'},{name:'secret_manager',purpose:'opaque secret references'},{name:'artifact_store',purpose:'immutable artifacts'},{name:'ticketing',purpose:'approval/change receipts'}],
 transitions:[
  {from:'input_registered',action:'validate_configuration',to:'configuration_validated',roles:['network_developer','network_reviewer'],requiresEvidence:true},
  {from:'configuration_validated',action:'approve_sandbox',to:'sandbox_approved',roles:['security_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'sandbox_approved',action:'record_run',to:'run_recorded',roles:['integration_operator'],requiresEvidence:true},
  {from:'run_recorded',action:'review_evaluation',to:'evaluation_review',roles:['network_reviewer','sre'],requiresEvidence:true,dualControl:true},
  {from:'evaluation_review',action:'approve_write',to:'write_approval',roles:['platform_operator','security_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'write_approval',action:'seal_artifact',to:'artifact_sealed',roles:['sre'],requiresEvidence:true},
  {from:'artifact_sealed',action:'queue_change',to:'change_queued',roles:['platform_operator'],requiresEvidence:true,dualControl:true},
  {from:'change_queued',action:'record_apply',to:'applied',roles:['integration_operator'],requiresEvidence:true},
  {from:'change_queued',action:'record_rollback',to:'rolled_back',roles:['integration_operator','sre'],requiresEvidence:true}
 ],
 assess:x=>{const regressions=Number(x.regressionCount);const valid=Number.isSafeInteger(regressions)&&regressions>=0;const ready=x.sandboxAttested===true&&x.testsPassed===true&&valid&&regressions===0;return{disposition:ready?'independent_network_change_review_required':'sandbox_test_or_regression_hold',executionCommand:null,writeAuthorized:false,reproducibility:{input:x.inputVersion,toolchain:x.toolchainVersion,fixtures:x.fixtureVersion}};}
};
