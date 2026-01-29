const Joi = require('joi');
const validateAssignmentInput = (data) => {
  const schema = Joi.object({
    subject: Joi.string().required().label('Subject'),
    title: Joi.string().required().label('Title'),
    description: Joi.string().required().label('Description'),
    dueDate: Joi.date().required().label('Due Date'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium').label('Priority'),
    studentIds: Joi.array().items(Joi.string()).min(1).required().label('Students'),
    grade: Joi.string().when('status', {
      is: 'graded',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    comments: Joi.string().allow('').optional(),
   
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateAssignmentInput };